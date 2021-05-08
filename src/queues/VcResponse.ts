import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import User, { IUserModel } from '../models/User';
import ArchivedUser from '../models/ArchivedUser';
import File from '../models/File';
import {VcModel} from '../domain/VcModel';
import { VCRequestStatus, VideoExtractionType, CaptionOutputFormat} from '../domain/VcModel/VCConstants';
import FileModel, {UserContext} from '../domain/FileModel';
import {FileProcessAssociations} from '../domain/FileModel/FileConstants';
import got from 'got';
import emailService from '../services/EmailService';
import ExceptionMessageTemplates, { ExceptionTemplateNames } from '../MessageTemplates/ExceptionTemplates';
import { getFormattedJson } from '../utils/formatter';
import {VCProcess} from "../domain/VCProcess";
import {VCLanguageModelType} from "../domain/VCProcess/VCProcessConstants";

export class VcResponseQueue {
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
    public dispatch(data: VCProcess): void {
        const options = {
            attempts: 2
        };
        this.queue.add(data, options);
    }

    private process(): void {
        this.queue.process(this.startVideoInsightResultAPI);
    }

    public async startVideoInsightResultAPI(_job: any, _done: any) {
        const logger = loggerFactory(VcResponseQueue.servicename, 'startVideoInsightResultAPI');
        logger.info('started processing: %o', _job.data);

        try {
        const vcProcess = new VCProcess(_job.data);
        const inputFile = await FileModel.getFileByHash(vcProcess.inputFileHash);
const videoInsights = new Map<VideoExtractionType, CaptionOutputFormat[]>([
[VideoExtractionType.CAPTION, [CaptionOutputFormat.SRT, CaptionOutputFormat.TXT]],
[VideoExtractionType.OCR, [CaptionOutputFormat.TXT]],
[VideoExtractionType.OCR_CAPTION, [CaptionOutputFormat.SRT, CaptionOutputFormat.TXT]]
]);
try {
if(inputFile !== null) {
const waitingRequestDetails = await vcProcess.getWaitingRequestsAndUsers();
const userContexts: UserContext[] = [];
waitingRequestDetails.forEach(waitingRequest => {
userContexts.push(new UserContext(waitingRequest.user?.userId || "", FileProcessAssociations.VC_OUTPUT, waitingRequest.user?.organizationCode || ""));
});

for(const [insightType, outputFormats] of videoInsights.entries()) {
for(const outputFormat of outputFormats) {
const fileKey = `${inputFile?.userContexts[0].organizationCode}/${inputFile?.fileId}/${vcProcess.insightAPIVersion}/${vcProcess.languageModelType === VCLanguageModelType.STANDARD ? VCLanguageModelType.STANDARD : vcProcess.languageModelId}/${VCProcess.getOutputZipFileName(insightType, outputFormat)}`;
const result: any = await VcResponseQueue.requestVideoInsightsByRequestType(vcProcess, inputFile, insightType, outputFormat, inputFile.container, fileKey);
if(result !== null) {
await vcProcess.changeStatusTo(VCRequestStatus.COMPLETED);

let outputFile = await FileModel.findFileByHash(result.hash);
if (outputFile === null ) {
outputFile = new FileModel({
userContexts:userContexts,
hash: result.hash,
container: process.env.AWS_BUCKET_NAME || "",
name: inputFile.name
});
await outputFile.persist();
await outputFile.setFileLocation(fileKey);
}
await vcProcess.updateVideoInsightResult(insightType, outputFormat, outputFile);
} 

}
}

await vcProcess.completeWaitingRequests();
} 
else 
throw new Error("inputFile missing with id: "+ vcProcess.inputFileId);
           
        } catch(error) {
            logger.error("error: %o", error);
            vcProcess.notifyVCProcessFailure(
                inputFile,
                getFormattedJson(error),
                500,
                `error in calling insight result api`,
                getFormattedJson(error),
                "unimplemented",
                VCRequestStatus.INSIGHT_FAILED
            );
                        }
        } catch (error) {
            logger.error('Error occurred: %o', error);
        }
        _done();
    }
    

   public static   async requestVideoInsightsByRequestType(vcProcess: VCProcess, inputFile:FileModel, insightType: VideoExtractionType, outputFormat: CaptionOutputFormat, container:string, fileKey:string) {
        const logger = loggerFactory(VcResponseQueue.servicename, 'requestVideoInsightsByRequestType');
        logger.info('requesting video insights for id: ' + vcProcess.externalVideoId);

        try {
            const resultPromise = got.post(`${process.env.SERVICE_API_HOST}/api/v1/vc/callback`, {
                json: {
                    id: vcProcess.externalVideoId,
                    type: insightType,
                    container: container,
                    file_key: fileKey,
                    outputFormat: outputFormat.toLowerCase()
                },
                responseType: 'json'
            });

            await vcProcess.changeStatusTo(VCRequestStatus.INSIGHT_REQUESTED);

            const result = await resultPromise;

            if (result.statusCode === 200) {
                return result.body;
            } else {
                vcProcess.changeStatusTo(VCRequestStatus.INSIGHT_FAILED);
            }
        } catch (error) {
            logger.error('video insight api call failed: %o', error);
            vcProcess.changeStatusTo(VCRequestStatus.INSIGHT_FAILED);
            vcProcess.notifyVCProcessFailure(inputFile,
                getFormattedJson(error),
                502,
                `call to insight result api failing for process id: ${vcProcess.processId}`,
getFormattedJson(error),
"unimplemented",
VCRequestStatus.INSIGHT_FAILED
                );
        }

        return null;
        }

}

export default new VcResponseQueue();
