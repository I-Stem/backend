/**
 * Define VC Request Queue
 *
 */
import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import User, { IUserModel } from '../models/User';
import ArchivedUser from '../models/ArchivedUser';
import File from '../models/File';
import {VcModel} from '../domain/VcModel';
import { VCRequestStatus } from '../domain/VcModel/VCConstants';
import FileModel from '../domain/FileModel';
import got from 'got';
import emailService from '../services/EmailService';
import ExceptionMessageTemplates, { ExceptionTemplateNames } from '../MessageTemplates/ExceptionTemplates';
import { getFormattedJson } from '../utils/formatter';
import VcResponseQueue from './VcResponse';
import { DocType } from '../domain/AfcModel/AFCConstants';
import {VCProcess} from "../domain/VCProcess";
import FileService from "../services/FileService";

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
    public dispatch(_data: {vcProcessData: VCProcess, inputFile: FileModel}): void {
        const options = {
            attempts: 2
        };
        this.queue.add(_data, options);
    }
    private process(): void {
        const logger = loggerFactory(VcRequestQueue.servicename, 'process');
        this.queue.process(async (_job: any, _done: any) => {
            logger.info('started processing: %o', _job.data);
            const vcProcess = new VCProcess(_job.data.vcProcessData);
const inputFile = new FileModel(_job.data.inputFile);
            try {
const result: any = await this.requestVideoInsights(vcProcess, inputFile);

if (result === null) {
vcProcess.changeStatusTo(VCRequestStatus.INDEXING_REQUEST_FAILED);
} else {
    await vcProcess.updateVideoId(result.videoId);
}
            } catch (error) {
                logger.error('encountered error in vc process flow: %o', error);
                vcProcess.notifyVCProcessFailure(
                    inputFile,
                    getFormattedJson(error),
                    500,
                    "call to insight extraction api failed",
                    getFormattedJson(error),
                    "unimplemented",
                    VCRequestStatus.INDEXING_API_FAILED
                );
            }

            _done();
        });
    }

    private async requestVideoInsights(vcProcess: VCProcess, file: FileModel) {
        const logger = loggerFactory(VcRequestQueue.servicename, 'requestVideoInsights');
        logger.info('requesting video indexing from ML repo');
        try {
        const resultPromise = got.post(`${process.env.SERVICE_API_HOST}/api/v1/vc`, {
            json: {
                name: vcProcess.inputFileHash,
                hash: file.hash,
                url: await FileService.getPresignedURL(file.container, file.fileKey),
                languageModelId : vcProcess.languageModelId
            },
            responseType: 'json'
        });

        await vcProcess.changeStatusTo(VCRequestStatus.INDEXING_REQUESTED);

        const result = await resultPromise;

        if (result.statusCode === 200) {
            return result.body;
        }

    } catch (error) {
        logger.error('video insight api call failed: %o', error);
        vcProcess.notifyVCProcessFailure(
            file, 
            getFormattedJson(error),
            error.code, 
            'Video insight extraction API call failed', 
            getFormattedJson(error),
            "unimplemented",
            VCRequestStatus.INDEXING_REQUEST_FAILED
            );
    }

        return null;
    }

}

export default new VcRequestQueue();
