import loggerFactory from "../../middlewares/WinstonLogger";
import FileModel, { FileCoordinate } from "../FileModel";
import UserModel from "../user/User";
import {AfcModel, AFCRequestLifecycleEvent} from "../AfcModel";
import {
    AFCRequestOutputFormat,
    AFCRequestStatus,
    DocType,
} from "../AfcModel/AFCConstants";
import AFCProcessDBModel from "../../models/AFCProcess";
import { onFileSaveToS3} from "../../utils/file";
import EmailService from "../../services/EmailService";
import ExceptionMessageTemplates from "../../MessageTemplates/ExceptionTemplates";
import {
    AFCProcessNotFoundError,
    AFCProcessFormattingResultMissingError,
} from "./AFCProcessErrors";
import afcResponse from "../../queues/afcResponse";
import { fileURLToPath } from "url";
import { getFormattedJson } from "../../utils/formatter";
import {MessageModel} from "../MessageModel";
import {
    HandleAccessibilityRequests,
} from "../organization/OrganizationConstants";

export interface AFCProcessProps {
    processId?: string;
    _id?: string;
    inputFileHash: string;
    inputFileId: string;
    pageCount?: number;

    ocrType: DocType;
    ocrVersion?: string;
    ocrWaitingQueue?: string[];

    expiryTime?: Date;

    ocrJSONFile?: { container: string; fileKey: string };

    outputFiles?: Map<AFCRequestOutputFormat, FileCoordinate>;
    status?: AFCRequestStatus;
    statusLog?: AFCRequestLifecycleEvent[];
}

export class AFCProcess {
    static serviceName = "AFCProcess";

    processId?: string;
    inputFileHash: string;
    inputFileId: string;
    pageCount?: number;
    ocrType: DocType;
    ocrVersion?: string;
    ocrWaitingQueue: string[];

    expiryTime?: Date;

    ocrJSONFile?: { container: string; fileKey: string };

    outputFiles?: Map<AFCRequestOutputFormat, FileCoordinate>;

    status: AFCRequestStatus = AFCRequestStatus.REQUEST_INITIATED;
    statusLog: AFCRequestLifecycleEvent[] = [
        new AFCRequestLifecycleEvent(AFCRequestStatus.REQUEST_INITIATED),
    ];

    constructor(props: AFCProcessProps) {
        this.processId = props.processId || props._id;
        this.inputFileHash = props.inputFileHash;
        this.inputFileId = props.inputFileId;
        this.pageCount = props.pageCount;
        this.ocrType = props.ocrType;
        this.ocrVersion = props.ocrVersion;
        this.ocrWaitingQueue = props.ocrWaitingQueue || [];

        this.expiryTime = props.expiryTime;
        this.ocrJSONFile = props.ocrJSONFile;

        this.outputFiles =
            props.outputFiles !== undefined
                ? new Map(Object.entries(props.outputFiles))
                : new Map();

        this.status = props.status || AFCRequestStatus.REQUEST_INITIATED;
        this.statusLog = props.statusLog || [
            new AFCRequestLifecycleEvent(this.status),
        ];
    }

    public async persist() {
        const logger = loggerFactory(AFCProcess.serviceName, "persist");

        try {
            const processInstance = await new AFCProcessDBModel(this).save();
            this.processId = processInstance._id;
            return this;
        } catch (error) {
            logger.error("error occurred: %o", error);
        }
    }

    public static async findOrCreateAFCProcess(props: AFCProcessProps) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "findOrCreateAFCProcess"
        );

        try {
            const afcProcessInstance = await AFCProcessDBModel.findOne({
                inputFileHash: props.inputFileHash,
                ocrType: props.ocrType,
                ocrVersion: props.ocrVersion,
            }).lean();

            if (afcProcessInstance !== null) {
                return new AFCProcess(afcProcessInstance);
            } else {
                logger.info(
                    "no afc Process found corresponding to the parameters"
                );
                const afcProcess = new AFCProcess(props);
                await afcProcess.persist();
                return afcProcess;
            }
        } catch (error) {
            logger.error("encountered error: %o", error);
        }
    }

    public static async getAFCProcess(
        inputFileHash: string,
        ocrType: DocType,
        ocrVersion: string
    ) {
        const logger = loggerFactory(AFCProcess.serviceName, "getAFCProcess");

        try {
            const afcProcessInstance = await AFCProcessDBModel.findOne({
                inputFileHash,
                ocrType,
                ocrVersion,
            });

            if (afcProcessInstance !== null) {
                return new AFCProcess(afcProcessInstance);
            } else
                throw new AFCProcessNotFoundError(
                    `AFC process not found for params: ${inputFileHash}, ${ocrType}, ${ocrVersion}`
                );
        } catch (error) {
            logger.error("encountered error: %o", error);
            throw error;
        }
    }

    public static async getAFCProcessById(processId: string) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "getAFCProcessById"
        );

        try {
            const afcProcessInstance = await AFCProcessDBModel.findById(
                processId
            );

            if (afcProcessInstance !== null) {
                return new AFCProcess(afcProcessInstance);
            } else
                throw new AFCProcessNotFoundError(
                    `AFC process not found for id ${processId}`
                );
        } catch (error) {
            logger.error("encountered error: %o", error);
            throw error;
        }
    }

    public async addAFCRequest(afcRequestId: string) {
        const logger = loggerFactory(AFCProcess.serviceName, "addAFCRequest");
        try {
            logger.info(
                "adding request to waiting queue: " +
                    afcRequestId +
                    " " +
                    this.ocrType
            );

            this.ocrWaitingQueue.push(afcRequestId);

            await AFCProcessDBModel.findByIdAndUpdate(this.processId, {
                $push: {
                    ocrWaitingQueue: afcRequestId,
                },
            }).exec();
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public isOCRComplete(): boolean {
        if (this.ocrJSONFile) {
            return true;
        }
        return false;
    }

    public isOCRInProgress(): boolean {
        const hasWaitingRequests = this.ocrWaitingQueue?.length > 0 ? true : false;
        if(this.status === AFCRequestStatus.OCR_FAILED || this.status === AFCRequestStatus.FORMATTING_FAILED)
        return false;
        else
        return hasWaitingRequests
    }

    public async clearWaitingQueue() {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "clearWaitingQueue"
        );
        logger.info("clearing the waiting queue");
        this.ocrWaitingQueue = [];
        await AFCProcessDBModel.findByIdAndUpdate(this.processId, {
            ocrWaitingQueue: [],
        }).exec();
    }

    public async updateOCRResults(hash: string, json: any, file: FileModel) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "updateOCRResults"
        );
        try {
            const ocrFileKey = `${file.userContexts[0].organizationCode}/${file.fileId}/${this.ocrType}/${this.ocrVersion}/${this.ocrType}.json`;
            const url = await onFileSaveToS3(
                JSON.stringify(json),
                process.env.AWS_BUCKET_NAME || "",
                ocrFileKey,
                "application/json"
            );
            logger.info(`Saved ocr json at: ${url.Location}`);
            this.ocrJSONFile = {
                container: process.env.AWS_BUCKET_NAME || "",
                fileKey: ocrFileKey,
            };
            await AFCProcessDBModel.findByIdAndUpdate(this.processId, {
                ocrJSONFile: this.ocrJSONFile,
            }).lean();
        } catch (err) {
            logger.error("error occured" + err);
            throw err;
        }
    }

    public async changeStatusTo(newStatus: AFCRequestStatus) {
        const logger = loggerFactory(AFCProcess.serviceName, "changeStatusTo");
        logger.info(
            `Changing status to: ${newStatus} of request: ${this.processId}`
        );
        this.status = newStatus;
        const event = new AFCRequestLifecycleEvent(newStatus);
        this.statusLog.push(event);

        await AFCProcessDBModel.findByIdAndUpdate(this.processId, {
            status: newStatus,
            $push: { statusLog: event },
        });

        return this;
    }

    public static async afcCronHandler(
        expiryTimeGTE: string,
        expiryTimeLTE: string
    ) {
        const logger = loggerFactory(AFCProcess.serviceName, "afcCronHandler");

        try {
            const expiringProcesses = await AFCProcessDBModel.find({
                expiryTime: {
                    $gte: new Date(expiryTimeGTE),
                    $lte: new Date(expiryTimeLTE),
                },
            }).lean();

            const impendingFailureStatus = [
                AFCRequestStatus.REQUEST_INITIATED,
                AFCRequestStatus.OCR_REQUESTED,
                AFCRequestStatus.OCR_REQUEST_ACCEPTED,
                AFCRequestStatus.OCR_COMPLETED,
                AFCRequestStatus.OCR_SKIPPED,
                AFCRequestStatus.FORMATTING_REQUESTED,
            ];

            const failedProcessesData = expiringProcesses.map(
                async (afcProcess) => {
                    const afcProcessDetails = new AFCProcess(afcProcess);
                    const hasImpendingFailureStatus = impendingFailureStatus.some(
                        (afcStatus) => afcStatus === afcProcessDetails?.status
                    );
                    if (hasImpendingFailureStatus) {
                        return afcProcessDetails;
                    }

                    return null;
                }
            );
            const results = (await Promise.all(failedProcessesData)).filter(
                (val) => val !== null
            );

            if (results.length <= 0) {
                logger.info(
                    `No failed AFC Request found during cron sweep for interval ${expiryTimeGTE} and ${expiryTimeLTE}`
                );
            } else {
                logger.info("notifying I-Stem for AFC cron failures");

                const failedProcessDetails: any[] = [];

                const res = results.map(async (afcProcess:AFCProcess) => {
                    const processRequests = await afcProcess?.notifyWaitingUsersAboutFailure(
                        AFCRequestStatus.OCR_FAILED
                    );

                    afcProcess?.changeStatusTo(AFCRequestStatus.OCR_FAILED);
                    const usersAffected: any[] = [];
                    processRequests?.forEach((data) => {
                        usersAffected.push({
                            userName: data.user?.fullname,
                            userEmail: data.user?.email,
                            documentName: data.afcRequest?.documentName,
                            organizationCode: data.afcRequest?.organizationCode,
                        });
                    });

                    failedProcessDetails.push({
                        inputFileHash: afcProcess?.inputFileHash || "",
                        inputFileLink: (
                            await FileModel.getFileById(
                                afcProcess?.inputFileId || ""
                            )
                        )?.inputURL,
                        ocrType: afcProcess?.ocrType,
                        ocRVersion: afcProcess?.ocrVersion,
                        usersAffected: usersAffected,
                    });

                    await afcProcess.clearWaitingQueue();
                });

                await Promise.all(res);
                AFCProcess.notifyIStemTeamAboutAFCProcessFailure(
                    ExceptionMessageTemplates.getAFCFailureMessage({
                        data: failedProcessDetails,
                        timeInterval: [expiryTimeGTE, expiryTimeLTE],
                    })
                );
            }
        } catch (error) {
            logger.error("Error occured in filtering AFC: %o", error);
        }
    }

    public async formatOutput() {
        const logger = loggerFactory(AFCProcess.serviceName, "formatOutput");

        try {
            const outputFormats = new Set<AFCRequestOutputFormat>();
            const requestingUsers: {
                userId: string;
                organizationCode: string;
            }[] = [];
            const results = this.ocrWaitingQueue.map(async (afcRequestId) => {
                const afcRequest = await AfcModel.getAfcModelById(afcRequestId);
                if (afcRequest !== null) {
                    if (this.outputFiles?.has(afcRequest.outputFormat)) {
                        await afcRequest?.changeStatusTo(
                            AFCRequestStatus.FORMATTING_COMPLETED
                        );
                        const outputFile = this.outputFiles?.get(
                            afcRequest.outputFormat
                        );
                        afcRequest.completeAFCRequestProcessing(
                            new FileCoordinate(
                                outputFile?.container || "",
                                outputFile?.fileKey || "",
                                outputFile?.fileId
                            )
                        );
                    } else outputFormats.add(afcRequest?.outputFormat);

                    requestingUsers.push({
                        userId: afcRequest.userId,
                        organizationCode: afcRequest.organizationCode,
                    });
                }

                return true;
            });

            await Promise.all(results);
            if (outputFormats.size > 0)
                afcResponse.dispatch({
                    afcProcess: this,
                    outputFormats: Array.from(outputFormats.values()),
                    requestingUsers,
                });
            else this.clearWaitingQueue();
        } catch (error) {
            logger.error("error: %o", error);
            this.notifyAFCProcessFailure(
                null,
                getFormattedJson(error),
                "couldn't create formatting requests",
                getFormattedJson(error),
                "to be implemented",
                AFCRequestStatus.FORMATTING_FAILED
            );
        }
    }

    public async updateFormattingResult(
        outputFormat: AFCRequestOutputFormat,
        outputFile: FileModel
    ) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "updateFormattingResult"
        );

        try {
            if (!this.outputFiles) {
                this.outputFiles = new Map();
            }

            this.outputFiles.set(outputFormat, {
                container: outputFile.container,
                fileKey: outputFile.fileKey,
                fileId: outputFile.fileId,
            });

            const afcProcess = await AFCProcessDBModel.findById(
                this.processId
            ).exec();
            if (afcProcess !== null) {
                if (!afcProcess.outputFiles) afcProcess.outputFiles = new Map();

                afcProcess.outputFiles.set(outputFormat, {
                    container: outputFile.container,
                    fileKey: outputFile.fileKey,
                    fileId: outputFile.fileId,
                });
                await afcProcess?.save();
            }
        } catch (error) {
            logger.error(
                "couldn't update the converted file information %o",
                error
            );
        }
    }

    public async notifyAFCProcessFailure(
        file: FileModel | null,
        response: any,
        reason: string,
        stackTrace: string,
        correlationId: string,
        failureStatus: AFCRequestStatus
    ) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "notifyAFCProcessFailure"
        );

        this.changeStatusTo(failureStatus);

        const waitingRequests = await this.notifyWaitingUsersAboutFailure(
            failureStatus
        );
        EmailService.sendInternalDiagnosticEmail(
            ExceptionMessageTemplates.getOCRExceptionMessage({
                reason: reason,
                code: response?.statusCode ? response?.statusCode : 500,
                stackTrace: stackTrace,
                inputURL: file?.inputURL,
                users: waitingRequests.map((waitingRequest) => {
                    return {
                        name: waitingRequest.user?.fullname,
                        email: waitingRequest.user?.email,
                        outputFormat: waitingRequest.afcRequest?.outputFormat,
                    };
                }),
            })
        );

        this.clearWaitingQueue();
    }

    public static async notifyIStemTeamAboutAFCProcessFailure(
        message: MessageModel
    ) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "notifyIStemAboutAFCProcessFailure"
        );

        EmailService.sendInternalDiagnosticEmail(message);
    }

    public async notifyWaitingUsersAboutFailure(
        failureStatus: AFCRequestStatus
    ) {
        const results = this.ocrWaitingQueue.map(async (afcRequestId) => {
            const afcRequest = await AfcModel.getAfcModelById(afcRequestId);
            const user = await UserModel.getUserById(afcRequest?.userId || "");

            if (user !== null) {

                        if(afcRequest?.resultType ===
                            HandleAccessibilityRequests.AUTO
                ) {
                    await EmailService.sendEmailToUser(
                        user,
                        ExceptionMessageTemplates.getAFCFailureMessageForUser({
                            documentName: afcRequest?.documentName || "",
                            user: user.fullname,
                        })
                    );
                }
            }

            afcRequest?.changeStatusTo(failureStatus);

            return {
                afcRequest,
                user,
            };
        });

        return await Promise.all(results);
    }

    public static async notifyErrorInAFCProcessFlow(
        file: FileModel | null,
        response: any,
        reason: string,
        stackTrace: string,
        correlationId: string,
        failureStatus: AFCRequestStatus
    ) {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "notifyErrorInAFCProcessFlow"
        );

        EmailService.sendInternalDiagnosticEmail(
            ExceptionMessageTemplates.getOCRExceptionMessage({
                reason: reason,
                code: response?.statusCode ? response?.statusCode : 500,
                stackTrace: stackTrace,
            })
        );
    }

    public async finishPendingUserRequests() {
        const logger = loggerFactory(
            AFCProcess.serviceName,
            "finishPendingUserRequests"
        );

        try {
            const results = this.ocrWaitingQueue.map(async (afcRequestId) => {
                const afcRequest = await AfcModel.getAfcModelById(afcRequestId);

                if (afcRequest !== null) {
                    if (this.outputFiles?.has(afcRequest.outputFormat)) {
                        await afcRequest?.changeStatusTo(
                            AFCRequestStatus.FORMATTING_COMPLETED
                        );
                        const outputFile = this.outputFiles?.get(
                            afcRequest.outputFormat
                        );
                        afcRequest.completeAFCRequestProcessing(
                            new FileCoordinate(
                                outputFile?.container || "",
                                outputFile?.fileKey || "",
                                outputFile?.fileId
                            )
                        );
                    } else {
                        throw new AFCProcessFormattingResultMissingError(
                            `formatting result missing for format: ${afcRequest.outputFormat} for document: ${afcRequest.documentName}`
                        );
                    }
                }
            });

            await Promise.all(results);
            this.clearWaitingQueue();
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public static getExpiryTime(pageNumber: number) {
        return new Date(
            new Date().getTime() + Math.ceil(pageNumber / 100) * 1000 * 60 * 60
        );
    }
}
