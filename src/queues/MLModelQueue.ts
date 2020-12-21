import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import AfcModel from '../domain/AfcModel';
import request from 'request-promise-native';
import MLModelModel from '../domain/MLModelModel';
import ExceptionMessageTemplates from '../MessageTemplates/ExceptionTemplates';
import emailService from '../services/EmailService';
import afcRequest from './afcRequest';
import ServiceRequestTemplates from '../MessageTemplates/ServiceRequestTemplates';
import UserModel from '../domain/User';

class MLModelQueue {
    public queue: any;
    static servicename = 'MLModelQueue';

    constructor() {
        const logger = loggerFactory(MLModelQueue.servicename, 'constructor');
        this.queue = new Queue('trainModel', {
            prefix: Locals.config().redisPrefix,
            redis: {
                host: Locals.config().redisHttpHost,
                db: Locals.config().redisDB,
                port: Locals.config().redisHttpPort,
                password: Locals.config().redisPassword
            },
            limiter: {
                max: 1000,
                duration: 5000
            }
        });

        this.queue
            .on('error', function(error: any) {
                logger.error(`Queue :: #${error} error processing `);
            })
            .on('waiting', (jobId: any, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on('active', (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on('completed', function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing`);
            });
        this.process();
    }

    public dispatch(_data: AfcModel): void {
        const logger = loggerFactory(MLModelQueue.servicename, 'dispatch');
        const options = {
            attempts: 2
        };
        logger.info('sending the message to MLModelQueue: %o', _data);
        this.queue.add(_data, options);
        logger.info('train model command  sent...');
    }

    private process(): void  {
        const logger = loggerFactory(MLModelQueue.servicename, 'process');
        this.queue.process( async (_job: any, _done: any) => {
            logger.debug( _job.data);

            try {
            let model = await MLModelModel.getModelById(_job.data.triggeringCaseId);
            let options = {
                url: `${process.env.SERVICE_API_HOST}/api/v1/customspeech`,
                method: 'POST',
                body: {
                    name: model?.name,
                    fileName: model?.name,
                    fileUrl: _job.data.outputURL
                },
                json: true
            };
            logger.info('Sending request to model training service');

            const response = await request(options);

            if (response.error) {
                emailService.sendInternalDiagnosticEmail(
                    ExceptionMessageTemplates.getCustomSpeechTrainingFailingMessage({
                        code: 502,
                        reason: 'custom speech api failing',
                        stackTrace: response.message,
                        correlationId: 'to be implemented',
                        userId: _job.data.userId,
                        modelName: model?.name,
                        dataFileId: _job.data.inputFileId,
                        afcRequestId: _job.data.afcRequestId,
                        outputURL: _job.data.outputURL
                    }));
            } else {
                model?.updateTrainedModelId(response.languageModelId);
                const user = await UserModel.getUserById(model?.createdBy || '');
                if (model !== null && user !== null) {
                    emailService.sendEmailToUser(user, ServiceRequestTemplates.getModelTrainingCompleteMessage({
                        userName: user.fullname,
                        modelName: model?.name || ''
                    }));
                }
            }
        } catch (error) {
            logger.error('encountered error in training model: %o', error);
        }
            _done();
        });
    }

}

export default new MLModelQueue();
