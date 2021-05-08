import Queue from "bull";
import got from "got";
import Form from "form-data";
import Locals from "../providers/Locals";
import loggerFactory from "../middlewares/WinstonLogger";
import File from "../models/File";
import {AfcModel} from "../domain/AfcModel";
import { AFCRequestStatus, AFCRequestOutputFormat, DocType, AFCTriggerer} from "../domain/AfcModel/AFCConstants";
import LedgerModel from "../domain/LedgerModel";
import MessageQueue from "./message";
import { getFormattedJson } from "../utils/formatter";
import Bull from "bull";
import emailService from "../services/EmailService";
import ExceptionMessageTemplates, {
    ExceptionTemplateNames,
} from "../MessageTemplates/ExceptionTemplates";
import MLModelQueue from "./MLModelQueue";
import FileModel, {UserContext} from "../domain/FileModel";
import UserModel from "../domain/user/User";
import ServiceRequestTemplates from "../MessageTemplates/ServiceRequestTemplates";
import * as https from "https";
import { FileProcessAssociations } from "../domain/FileModel/FileConstants";
import {AFCProcess} from "../domain/AFCProcess";
import FileService from "../services/FileService";

export class AfcResponseQueue {
    public queue: Bull.Queue;
    static servicename = "AFCResponseQueue";

    constructor() {
        const methodname = "constructor";
        const logger = loggerFactory.call(
            this,
            AfcResponseQueue.servicename,
            methodname
        );
        this.queue = new Queue("afcResponse", {
            prefix: Locals.config().redisPrefix,
            redis: {
                host: Locals.config().redisHttpHost,
                db: Locals.config().redisDB,
                port: Locals.config().redisHttpPort,
                password: Locals.config().redisPassword,
            },
            limiter: {
                max: 1000,
                duration: 5000,
            },
        });

        this.queue
            .on("waiting", (jobId: string, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on("active", (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on("completed", function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing `);
            });
        this.process();
    }
    public dispatch(data: { afcProcess: AFCProcess; outputFormats: AFCRequestOutputFormat[]; requestingUsers:{userId:string; organizationCode:string}[] }): void {
        const logger = loggerFactory(AfcResponseQueue.servicename, "dispatch");
        const options = {
            attempts: 2,
        };
        this.queue.add(data, options);
        logger.info("Data added to AFC response queue");
    }

    private process(): void {
        this.queue.process(this.makeFormattingRequest);
    }

    public             async makeFormattingRequest(_job: any, _done: any) {
        const logger = loggerFactory(AfcResponseQueue.servicename, "makeFormattingRequest");
        const afcProcess = new AFCProcess(_job.data.afcProcess);
        try {
logger.info("starting format conversion requests");
            const results = _job.data.outputFormats.map(async (outputFormat:AFCRequestOutputFormat) => {
                try {
                    logger.info("requesting for format: " + outputFormat);
                    const inputFile = await FileModel.getFileById(afcProcess.inputFileId);
                    const fileKey = `${inputFile?.userContexts[0].organizationCode}/${inputFile?.fileId}/${afcProcess.ocrType}/${afcProcess.ocrVersion}/afcOutput.${outputFormat.toLowerCase()}`;
                const formattingAPIResult = await AfcResponseQueue.requestFormatting(
                    afcProcess,
                    outputFormat,
                    process.env.AWS_BUCKET_NAME || "",
                    fileKey
                );
                if (formattingAPIResult.code === 500) {
                    afcProcess.notifyAFCProcessFailure(
                        null,
                        getFormattedJson( formattingAPIResult),
                        `Formatting API failed for output format: ${outputFormat}`,
                        getFormattedJson( formattingAPIResult),
"to be implemented",
AFCRequestStatus.FORMATTING_FAILED
                    );

                    return false;
                    }

                logger.info(
                    "received response from formatting service: %o",
                    formattingAPIResult
                );

                if ( formattingAPIResult?.code === 200) {
                    const userContexts:UserContext[] = [];
                    _job.data.requestingUsers.forEach(element => {
                        userContexts.push(new UserContext(element.userId, FileProcessAssociations.AFC_OUTPUT, element.organizationCode));
                    });

                    let outputFile = await FileModel.findFileByHash(formattingAPIResult.hash);
                    if(outputFile === null) {
                    outputFile = new FileModel({
                        userContexts: userContexts,
hash: formattingAPIResult.hash,
container: process.env.AWS_BUCKET_NAME || "",
fileKey : fileKey,
name: FileModel.getFileNameByProcessAssociationType("output" + outputFormat.toLowerCase(), FileProcessAssociations.AFC_OUTPUT) || ""
                    });
                    await outputFile.persist();
                    outputFile.setFileLocation(fileKey);
                }
                    afcProcess.changeStatusTo(
                        AFCRequestStatus.FORMATTING_COMPLETED
                    );
                    await afcProcess.updateFormattingResult(
                        outputFormat,
                        outputFile
                    );
            } else if ( formattingAPIResult?.code === 500) {
                logger.error("formatting api failing for " + outputFormat );
                afcProcess.notifyAFCProcessFailure(
                    inputFile,
                    `formatting API returned 500 in response`,
                    `Formatting API failed for output format: ${outputFormat} with 500 in response`,
"",
"to be implemented",
AFCRequestStatus.FORMATTING_FAILED
                );
                }
            return true;
        } catch(error) {
            logger.error("formatting api failing for " + outputFormat + " %o", error);
            afcProcess.notifyAFCProcessFailure(
                null,
                `couldn't connect to formatting api`,
                `Formatting API failed for output format: ${outputFormat}`,
"",
"to be implemented",
AFCRequestStatus.FORMATTING_FAILED
            );
        }

        return false;
        });

await Promise.all(results);
logger.info("finished all format conversion requests");
afcProcess.finishPendingUserRequests();
        } catch (error) {
            logger.error(
                "encountered error in afc response flow: %o",
                error
            );
        }

        _done();
    }
    

    public static async requestFormatting(
        afcProcess: AFCProcess,
outputFormat: AFCRequestOutputFormat,
container:string,
fileKey: string,
        serviceType?: string
    ): Promise<any> {
        const logger = loggerFactory(
            AfcResponseQueue.servicename,
            "requestFormatting"
        );
        logger.info("calling formatting API");
        try {
            let response;
            if(afcProcess.ocrJSONFile)
            response = await FileService.getFileDataByS3Key(afcProcess.ocrJSONFile.container, afcProcess.ocrJSONFile.fileKey);
            const formattingAPIResult = await got.post(
                `${process.env.SERVICE_API_HOST}/api/v1/ocr/format`,
                {
                    json: {
                        json: JSON.parse(response.Body.toString("utf-8")),
                        format: outputFormat,
                        container: container,
                        file_key: fileKey
                    },
                    responseType: "json",
                }
            );
            return formattingAPIResult.body;
        } catch (error) {
            logger.error("error: %o", error);
            if (serviceType === "escalation") {
                this.handleFormattingAPIError(afcProcess, error,  "escalation");
                throw new Error("Failure in docx conversion");
            }
            this.handleFormattingAPIError(afcProcess, error,  "");
            return;
        }
    }

    private static async handleFormattingAPIError(
        afcProcess: AFCProcess,
        formattingAPIResult: any,
        serviceType: string
    ) {
        const logger = loggerFactory(
            AfcResponseQueue.servicename,
            "handleFormattingAPIError"
        );
        logger.error(
            "formatting failed: %o, %o",
            formattingAPIResult.statusCode,
            formattingAPIResult.body
        );

        afcProcess.notifyAFCProcessFailure(
            null,
            getFormattedJson (formattingAPIResult),
            getFormattedJson(formattingAPIResult),
            formattingAPIResult.code,
            "to be implemented",
            AFCRequestStatus.FORMATTING_FAILED
            );
    }
}

export default new AfcResponseQueue();
