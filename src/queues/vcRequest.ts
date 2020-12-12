/**
 * Define cron job for user verification
 *
 */
import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import User, { IUserModel } from '../models/User';
import ArchivedUser from '../models/ArchivedUser';
import File from '../models/File';
import VcModel, { VCRequestStatus } from '../domain/VcModel';
import FileModel from '../domain/FileModel';
import got from 'got';
import emailService from '../services/EmailService';
import MessageModel, { MessageLabel } from '../domain/MessageModel';
import ExceptionMessageTemplates, { ExceptionTemplateNames } from '../MessageTemplates/ExceptionTemplates';
import { getFormattedJson } from '../utils/formatter';
import VcResponseQueue from './VcResponse';

class VcRequestQueue {
    static servicename = 'VCRequestQueue';
    public queue: any;
    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory(VcRequestQueue.servicename, methodname);
        this.queue = new Queue('vcRequest', {
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
    public dispatch(_data: VcModel): void {
        const options = {
            attempts: 2
        };
        this.queue.add(_data, options);
    }
    private process(): void {
        const logger = loggerFactory(VcRequestQueue.servicename, 'process');
        this.queue.process(async (_job: any, _done: any) => {
            logger.info('started processing: %o', _job.data);
            const vcRequest = new VcModel(_job.data);

            try {
            const file = await FileModel.getFileById(vcRequest.inputFileId);

            if (file !== null) {
                if (file.externalVideoId && file.waitingQueue.length === 0) {
                    await vcRequest.changeStatusTo(VCRequestStatus.INDEXING_SKIPPED);
                    VcResponseQueue.dispatch({
    vcRequestId: vcRequest.vcRequestId,
    videoId: file.externalVideoId
});
                } else if (this.isVideoIndexingRequired(file)) {
const result: any = await this.requestVideoInsights(vcRequest, file);

if (result === null) {
vcRequest.changeStatusTo(VCRequestStatus.INDEXING_REQUEST_FAILED);
} else {
    file.addRequestToWaitingQueue(vcRequest.vcRequestId);
    await file.updateVideoId(result.videoId);
}

                } else {
                    await file.addRequestToWaitingQueue(vcRequest.vcRequestId);
                }
            } else {
                this.sendAPIFailureAlert(vcRequest, file, 200, 'couldn\'t get input file', 'none');
            }

            } catch (error) {
                logger.error('encountered error in vc request flow: %o', error);
            }

            _done();
        });
    }

    private isVideoIndexingRequired(file:FileModel ):boolean {
        const logger = loggerFactory(VcRequestQueue.servicename, "isVideoIndexingRequired");
        const isFileMoreThanHourOld = (new Date().getTime() - file?.createdAt?.getTime()) > (1000*60*60*1);
        logger.info("file age: " + isFileMoreThanHourOld);

        if(
            (file.waitingQueue && file?.waitingQueue?.length === 0)
            || isFileMoreThanHourOld) {
logger.info("Video indexing needed");
            return true;
            }
            else
            return false;
    }

    private async requestVideoInsights(vcRequest: VcModel, file: FileModel) {
        const logger = loggerFactory(VcRequestQueue.servicename, 'requestVideoInsights');
        logger.info('requesting video indexing from ML repo');

        try {
        const resultPromise = got.post(`${process.env.SERVICE_API_HOST}/api/v1/vc`, {
            json: {
                requestType: vcRequest.requestType,
                name: vcRequest.documentName,
                hash: file.hash,
                url: file?.inputURL,
                languageModelId : vcRequest.modelId
            },
            responseType: 'json'
        });

        await vcRequest.changeStatusTo(VCRequestStatus.INDEXING_REQUESTED);

        const result = await resultPromise;

        if (result.statusCode === 200) {
            return result.body;
        }

    } catch (error) {
        logger.error('video insight api call failed: %o', error);
        this.sendAPIFailureAlert(vcRequest, file, error.code, 'API call failed', getFormattedJson(error));
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
    modelId: vcRequest.modelId,
    inputFileId: vcRequest.inputFileId,
    inputURL: file?.inputURL,
    documentName: vcRequest.documentName
}));
    }

}

export default new VcRequestQueue();
