/**
 * Define cron job for user verification
 *
 */
import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import request from 'request-promise-native';
import * as https from 'https';
import { AfCResponseQueue } from '.';
import AfcModel, { AFCRequestStatus } from '../domain/AfcModel';
import FileModel from '../domain/FileModel';
import ExceptionMessageTemplates from '../MessageTemplates/ExceptionTemplates';
import emailService from '../services/EmailService';
import { getFormattedJson } from '../utils/formatter';

class AfcRequestQueue {
    public queue: any;
    static servicename = 'AFCRequestQueue';

    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory.call(this, AfcRequestQueue.servicename, methodname);
        this.queue = new Queue('afcRequest', {
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
    public dispatch(_data: AfcModel): void {
        const methodName = 'dispatch';
        const logger = loggerFactory(AfcRequestQueue.servicename, methodName);
        logger.info('Adding message to queue: %o', _data);
        const options = {
            attempts: 2
        };
        this.queue.add(_data, options);
    }

    private process(): void {
        const logger = loggerFactory(AfcRequestQueue.servicename, 'process');
        this.queue.process(async (_job: any, _done: any) => {

    try {
        const afcRequest = new AfcModel(_job.data);
        const file = await FileModel.getFileById(afcRequest.inputFileId);
        if(!file) {
            logger.info("couldn't file by id");
            throw Error("no file with such id")
        }
        if (!file?.json || file?.OCRVersion !== process.env.OCR_VERSION) { // OCR is not completed or version change
                  logger.info('OCR is pending');
                  logger.info(`Current OCR Version: ${file?.OCRVersion} New OCR Version: ${process.env.OCR_VERSION}`);
                  file?.updateOCRVersion(process.env.OCR_VERSION || '');
                  if (this.isOCRRequired(file)) {
                    logger.info('read file with id: ' + file?.fileId);
                    const filePath = String(file?.inputURL || '');
                    https.get(filePath, async (fileData:any) => {
                        const response = await this.requestOCR(file, afcRequest, filePath, fileData);
                        if (response !== null) {
afcRequest.changeStatusTo(AFCRequestStatus.OCR_REQUEST_ACCEPTED);
file?.addRequestToWaitingQueue(afcRequest.afcRequestId);
                        }
                    });
                    } else {
                    afcRequest.changeStatusTo(AFCRequestStatus.OCR_SKIPPED);
                    file?.addRequestToWaitingQueue(afcRequest.afcRequestId);
                                    }
                  
                } else {
                    afcRequest.changeStatusTo(AFCRequestStatus.OCR_SKIPPED)
                    AfCResponseQueue.dispatch({fileId: file.fileId, afcRequestId: _job.data.afcRequestId});
                }

            } catch (error) {
logger.error('got error in afc request queue %o', error);
            }
    _done();
        });
    }

    private isOCRRequired(file:FileModel ):boolean {
        const logger = loggerFactory(AfcRequestQueue.servicename, "isOCRRequired");
        const isFileMoreThanHourOld = (new Date().getTime() - file?.createdAt?.getTime()) > (1000*60*60*1);
        logger.info("file age: " + isFileMoreThanHourOld);
        if(
            !file?.waitingQueue
            ||file?.waitingQueue?.length === 0
            || isFileMoreThanHourOld) {
logger.info("OCR needed");
            return true;
            }
            else
            return false;
    }
     public async requestOCR(file: FileModel, afcRequest: AfcModel, filePath: string, inputFileData: any) {
        const logger = loggerFactory(AfcRequestQueue.servicename, 'requestOCR');
        logger.info('afc request: %o', afcRequest);
        const options = {
            url: `${process.env.SERVICE_API_HOST}/api/v1/ocr`,
            method: 'POST',
            resolveWithFullResponse: true ,
            formData: {
                file: {
                    value: inputFileData,
                    options: {
                        filename: filePath.split('/').pop()
                    }
                },
                hash: file?.hash,
                name:  file?.hash,
                doc_type: afcRequest?.docType
            }
        };
        logger.info('sending request to OCR service');
        try {
        const ocrAPIResultPromise = request(options);
        afcRequest.changeStatusTo(AFCRequestStatus.OCR_REQUESTED);

        const ocrAPIResult = await ocrAPIResultPromise;
        logger.info('status code: ' + ocrAPIResult.statusCode);
        if (ocrAPIResult.statusCode === 200) {
            logger.info('successfully submitted OCR request to server: %o', ocrAPIResult.body);
            return ocrAPIResult.body;
} else {
    logger.error('OCR API request failed: %n %o', ocrAPIResult.statusCode, ocrAPIResult.body);
    afcRequest.changeStatusTo(AFCRequestStatus.OCR_REQUEST_REJECTED);
    this.sendOCRAPIFailureMessage(afcRequest, file, ocrAPIResult, 'ocr submission rejected with non-200 status', getFormattedJson(ocrAPIResult.body), 'to be implemented');
}
    } catch (error) {
    logger.error('got error while requesting for OCR: %o', error);
    afcRequest.changeStatusTo(AFCRequestStatus.OCR_REQUEST_REJECTED);
    this.sendOCRAPIFailureMessage(afcRequest, file, null, 'ocr api submision to aa failed.', getFormattedJson(error), 'to be implemented');
}

        return null;
}

public sendOCRAPIFailureMessage(afcRequest: AfcModel, file: FileModel, response: any, reason: string, stackTrace: string, correlationId: string) {
    emailService.sendInternalDiagnosticEmail(ExceptionMessageTemplates.getOCRExceptionMessage({
        reason: reason,
        code: response?.statusCode ? response?.statusCode : 500,
        stackTrace: stackTrace,
        inputURL: file?.inputURL
    }));

}

}

export default new AfcRequestQueue();
