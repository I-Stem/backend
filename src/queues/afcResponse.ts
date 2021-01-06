import Queue from 'bull';
import got from 'got';
import Form from 'form-data';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import File from '../models/File';
import AfcModel, { AFCRequestStatus, DocType } from '../domain/AfcModel';
import LedgerModel from '../domain/LedgerModel';
import MessageQueue from './message';
import {getFormattedJson} from '../utils/formatter';
import Bull from 'bull';
import { AFCTriggerer } from '../domain/AfcModel';
import emailService from '../services/EmailService';
import ExceptionMessageTemplates, { ExceptionTemplateNames } from '../MessageTemplates/ExceptionTemplates';
import MLModelQueue from './MLModelQueue';
import FileModel from '../domain/FileModel';
import UserModel from '../domain/User';
import ServiceRequestTemplates from '../MessageTemplates/ServiceRequestTemplates';
import * as https from 'https';

class AfcResponseQueue {
    public queue: Bull.Queue;
    static servicename = 'AFCResponseQueue';

    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory.call(this, AfcResponseQueue.servicename, methodname);
        this.queue = new Queue('afcResponse', {
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
    public dispatch(data: {fileId: string, afcRequestId: string}): void {
        const logger = loggerFactory(AfcResponseQueue.servicename, 'dispatch');
        const options = {
            attempts: 2
        };
        this.queue.add(data, options);
        logger.info('Data added to AFC response queue');
    }

    private process(): void {
        const logger = loggerFactory(AfcResponseQueue.servicename, 'process');
        this.queue.process(async (_job: any, _done: any) => {
            logger.info('Processing AFC Response queue: %o', _job.data);

            try {
                const file = await FileModel.getFileById(_job.data.fileId);
                const afcRequest = await AfcModel.getAfcModelById(_job.data.afcRequestId);

                await afcRequest?.changeStatusTo(AFCRequestStatus.OCR_COMPLETED);

                if (afcRequest !== null && file !== null) {
const formattingAPIResult = await this.requestFormatting(afcRequest, file);
if (formattingAPIResult.code === 500) {
    const user = await UserModel.getUserById(afcRequest.userId);
    if (user) {
        emailService.sendEmailToUser(user, ExceptionMessageTemplates.getFailureMessageForUser({ user, data: afcRequest }));
    }
}
logger.info('received response from formatting service: %o', formattingAPIResult);

if (formattingAPIResult.code === 200) {
    afcRequest.changeStatusTo(AFCRequestStatus.FORMATTING_COMPLETED);
    afcRequest.updateFormattingResults(formattingAPIResult.url, file.pages || 0);

    if (afcRequest.triggeredBy === AFCTriggerer.USER) {
            await LedgerModel.createDebitTransaction(
                 afcRequest.userId,
                file.pages || 0,
                'Document accessibility conversion of file:' + afcRequest.documentName);

            logger.info('sending email to user for user triggered afc request');
            const user = await UserModel.getUserById(afcRequest.userId);
            if (user !== null) {
            await emailService.sendEmailToUser(user, ServiceRequestTemplates.getServiceRequestComplete({
                userName: user.fullname,
                userId: user.userId,
outputURL: formattingAPIResult.url,
documentName: afcRequest.documentName
            }));
        } else {
        logger.error('couldn\'t get user by id: ' + afcRequest.userId);
}

                                } else {
                                    logger.info('Triggereing video captioning model training flow');

                                    await LedgerModel.createDebitTransaction(
                                        afcRequest.userId,
                                       file.pages || 0,
                                       'custom language model training');

                                    MLModelQueue.dispatch(afcRequest);

                                }
                            }
                        } else {
                            afcRequest?.changeStatusTo(AFCRequestStatus.FORMATTING_FAILED);
                            logger.error('couldn\'t retrieve afc request or file: ' + afcRequest?.afcRequestId + ' file: ' + file?.fileId);
                        }
                        } catch (error) {
                            logger.error('encountered error in afc response flow: %o',  error);
                        }

            _done();
        });
    }

public async requestFormatting(afcRequest: AfcModel, file: FileModel): Promise<any> {
    const logger = loggerFactory(AfcResponseQueue.servicename, 'requestFormatting');
    logger.info('calling formatting API');
    try {
        const filePath = String(file?.ocrFileURL || '');
        const response = await got.get(filePath);
        console.log("Response: ", JSON.parse(response.body));
        const formattingAPIResult = await got.post(`${process.env.SERVICE_API_HOST}/api/v1/ocr/format`, {
                json: {
                    json: JSON.parse(response.body),
                    format: afcRequest?.outputFormat,
                    hash: file.hash,
                    documentName: afcRequest?.documentName
                },
                responseType: 'json'
            });
        return formattingAPIResult.body;

        } catch (error) {
            this.handleFormattingAPIError(afcRequest, error, file);
            return;
        }

}

    private async handleFormattingAPIError(afcRequest: AfcModel, formattingAPIResult: any, file: FileModel) {
        const logger = loggerFactory(AfcResponseQueue.servicename, 'handleFormattingAPIError');
        logger.error('formatting failed: %o, %o', formattingAPIResult.statusCode, formattingAPIResult.body);
        afcRequest.changeStatusTo(AFCRequestStatus.FORMATTING_FAILED);
        emailService.sendInternalDiagnosticEmail(ExceptionMessageTemplates.getFormattingAPIFailingExceptionMessage({
    code: formattingAPIResult.statusCode,
    reason: 'formatting api failing',
    stackTrace: formattingAPIResult,
correlationId: 'to be implemented',
userId: afcRequest.userId,
afcRequestId: afcRequest.afcRequestId,
OCRVersion: file.OCRVersion,
inputFileId: afcRequest.inputFileId,
inputURL: file.inputURL
}));
        const user = await UserModel.getUserById(afcRequest.userId);
        if (user) {
            emailService.sendEmailToUser(user, ExceptionMessageTemplates.getFailureMessageForUser({ user, data: afcRequest }));
        }
    }
}

export default new AfcResponseQueue();
