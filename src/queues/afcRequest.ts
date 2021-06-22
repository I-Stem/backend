/**
 * Define cron job for user verification
 *
 */
import Queue from "bull";
import Locals from "../providers/Locals";
import loggerFactory from "../middlewares/WinstonLogger";
import request from "request-promise-native";
import * as https from "https";
import AfCResponseQueue from "./afcResponse";
import {AfcModel} from "../domain/AfcModel";
    import { AFCRequestStatus, DocType } from "../domain/AfcModel/AFCConstants";
import FileModel from "../domain/FileModel";
import ExceptionMessageTemplates from "../MessageTemplates/ExceptionTemplates";
import emailService from "../services/EmailService";
import { getFormattedJson } from "../utils/formatter";
//import * as pdfJS from "pdfjs-dist/es5/build/pdf";
import AFCDbModel from "../models/AFC";
import UserModel from "../domain/user/User";
import {AFCProcess} from "../domain/AFCProcess";
import FileService from "../services/FileService";

export class AfcRequestQueue {
    public queue: any;
    static servicename = "AFCRequestQueue";

    constructor() {
        const methodname = "constructor";
        const logger = loggerFactory.call(
            this,
            AfcRequestQueue.servicename,
            methodname
        );
        this.queue = new Queue("afcRequest", {
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
    public dispatch(_data: {inputFile: FileModel, afcProcessData: AFCProcess}): void {
        const methodName = "dispatch";
        const logger = loggerFactory(AfcRequestQueue.servicename, methodName);
        logger.info("Adding message to queue: %o", _data);
        const options = {
            attempts: 2,
        };
        this.queue.add(_data, options);
    }

public             async makeOCRRequest(_job: any, _done: any) {
    const logger = loggerFactory(AfcRequestQueue.servicename, "makeOCRRequest");
    try {
        const afcProcess = new AFCProcess(_job.data.afcProcessData);
        const file = new FileModel(_job.data.inputFile);

                const fileData = await FileService.getFileDataByS3Key(file.container, file.fileKey);

                    const response = await AfcRequestQueue.requestOCR(
                        file,
                        afcProcess,
                        fileData,
                    );
                    if (response !== null) {
                        afcProcess.changeStatusTo(
                            AFCRequestStatus.OCR_REQUEST_ACCEPTED
                        );
                    }

    } catch (error) {
        logger.error("got error in afc request queue %o", error);
    }
    _done();
};

    private process(): void {
        this.queue.process(this.makeOCRRequest);
    }

    public static async requestOCR(
        file: FileModel,
        afcProcess: AFCProcess,
        inputFileData: any
    ) {
        const logger = loggerFactory(AfcRequestQueue.servicename, "requestOCR");
        
        const options = {
            url: `${process.env.SERVICE_API_HOST}/api/v1/ocr`,
            method: "POST",
            resolveWithFullResponse: true,
            formData: {
                file: {
                    value: inputFileData.Body,
                    options: {
                        filename: file.name
                    }
                },
                hash: file?.hash,
                container: file.container,
                file_key: file.fileKey,
                name:  file?.name,
                doc_type: afcProcess.ocrType,
                ocr_version: afcProcess.ocrVersion
            }
        };
        logger.info(`sending request to OCR service for process: ${afcProcess.processId}`);
        try {
            const ocrAPIResultPromise = request(options);
            afcProcess.changeStatusTo(AFCRequestStatus.OCR_REQUESTED);

            const ocrAPIResult = await ocrAPIResultPromise;
            logger.info("status code: " + ocrAPIResult.statusCode);
            if (ocrAPIResult.statusCode === 200) {
                logger.info(
                    "successfully submitted OCR request to server: %o",
                    ocrAPIResult.body
                );
                return ocrAPIResult.body;
            } else {
                logger.error(
                    "OCR API request failed: %n %o",
                    ocrAPIResult.statusCode,
                    ocrAPIResult.body
                );
                afcProcess.changeStatusTo(
                    AFCRequestStatus.OCR_REQUEST_REJECTED
                );
                afcProcess.notifyAFCProcessFailure(
                    file,
                    ocrAPIResult,
                    "ocr submission rejected with non-200 status",
                    getFormattedJson(ocrAPIResult.body),
                    "to be implemented",
                    AFCRequestStatus.OCR_FAILED
                );
            }
        } catch (error) {
            logger.error("got error while requesting for OCR: %o", error);
            afcProcess.changeStatusTo(AFCRequestStatus.OCR_REQUEST_REJECTED);
            afcProcess.notifyAFCProcessFailure(
                file,
                null,
                "ocr api submision to aa failed.",
                getFormattedJson(error),
                "to be implemented",
                AFCRequestStatus.OCR_FAILED
            );
        }

        return null;
    }



}

export default new AfcRequestQueue();
