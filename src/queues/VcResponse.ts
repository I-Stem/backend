import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import User, { IUserModel } from '../models/User';
import ArchivedUser from '../models/ArchivedUser';
import File from '../models/File';
import {VcModel} from '../domain/VcModel';
import { VCRequestStatus, VideoExtractionType } from '../domain/VcModel/VCConstants';
import FileModel from '../domain/FileModel';
import got from 'got';
import emailService from '../services/EmailService';
import MessageModel, { MessageLabel } from '../domain/MessageModel';
import ExceptionMessageTemplates, { ExceptionTemplateNames } from '../MessageTemplates/ExceptionTemplates';
import { getFormattedJson } from '../utils/formatter';

class VcResponseQueue {
    static servicename = 'VcResponseQueue';
    public queue: any;
    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory(VcResponseQueue.servicename, methodname);
        this.queue = new Queue('vcResponse', {
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
            .on('waiting', (jobId: string, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on('active', (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on('completed', function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing `);
            });
        this.process();
    }
    public dispatch(data: {vcRequestId: string, videoId: string} ): void {
        const options = {
            attempts: 2
        };
        this.queue.add(data, options);
    }

    private process(): void {
        const logger = loggerFactory(VcResponseQueue.servicename, 'process');
        this.queue.process(async (_job: any, _done: any) => {
            logger.info('started processing: %o', _job.data);

            try {
            const vcRequest = await VcModel.getVCRequestById(_job.data.vcRequestId);

            if (vcRequest !== null) {
                const result: any = await this.requestVideoInsightsByRequestType(_job.data.videoId, vcRequest);

                const results = Promise.all([
                    vcRequest.updateOutputURLAndVideoLength(result.url, Math.ceil(result.duration)),
                     vcRequest.chargeUserForRequest(),
                    vcRequest.notifyUserForResults()
                                    ]);
                await results;
                await vcRequest.changeStatusTo(VCRequestStatus.COMPLETED);

            }
            } catch (error) {
                logger.error('Error occurred: %o', error);
            }
            _done();
        });
    }

    private async requestVideoInsightsByRequestType(videoId: string, vcRequest: VcModel) {
        const logger = loggerFactory(VcResponseQueue.servicename, 'requestVideoInsightsByRequestType');
        logger.info('requesting video insights for id: ' + videoId);

        const file = await FileModel.getFileById(vcRequest.inputFileId);
        try {
            const resultPromise = got.post(`${process.env.SERVICE_API_HOST}/api/v1/vc/callback`, {
                json: {
                    id: videoId,
                    type: vcRequest.requestType,
                    hash: file?.hash,
                    documentName: vcRequest.documentName,
                    outputFormat: vcRequest.outputFormat
                },
                responseType: 'json'
            });

            await vcRequest.changeStatusTo(VCRequestStatus.INSIGHT_REQUESTED);

            const result = await resultPromise;

            if (result.statusCode === 200) {
                return result.body;
            }

        } catch (error) {
            logger.error('video insight api call failed: %o', error);
            vcRequest.changeStatusTo(VCRequestStatus.INSIGHT_FAILED);
            this.sendAPIFailureAlert(vcRequest, file, error.code, 'Insight extraction API call failed', getFormattedJson(error));
        }

        return null;
        }

    private sendAPIFailureAlert(vcRequest: VcModel, file: FileModel|null, code: number, errorReason: string, errorResponse: string = '') {
        emailService.sendInternalDiagnosticEmail(ExceptionMessageTemplates.getVideoInsightAPIFailureMessage({
            code: code,
            reason: errorReason,
            stackTrace: errorResponse,
            correlationId: 'to be implemented',
            userId: vcRequest.userId,
            vcRequestId: vcRequest.vcRequestId,
            requestType: vcRequest.requestType,
            inputFileId: vcRequest.inputFileId,
            inputURL: file?.inputURL,
            documentName: vcRequest.documentName
        }));
            }

}

export default new VcResponseQueue();
