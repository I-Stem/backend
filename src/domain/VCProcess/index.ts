import loggerFactory from "../../middlewares/WinstonLogger";
import {    VCRequestLifecycleEvent, VcModel} from "../VcModel";
import {
    VCRequestStatus,
    VideoExtractionType,
    CaptionOutputFormat,
} from "../VcModel/VCConstants";
import VCProcessDBModel from "../../models/VCProcess";
import FileModel, { FileCoordinate } from "../FileModel";
import { VCProcessNotFoundError } from "./VCProcessErrors";
import { VCRequestQueue } from "../../queues";
import ExceptionMessageTemplates from "../../MessageTemplates/ExceptionTemplates";
import {MessageModel} from "../MessageModel";
import EmailService from "../../services/EmailService";

import UserModel from "../user/User";
import VcResponse from "../../queues/VcResponse";
import {OrganizationModel} from "../organization";
import {
    HandleAccessibilityRequests,
} from "../organization/OrganizationConstants";
import {VCLanguageModelType} from "./VCProcessConstants";


export class VCOutput {
    outputFormat: CaptionOutputFormat;
    insightType: VideoExtractionType;
    file: FileCoordinate;

    constructor(
        insightType: VideoExtractionType,
        outputFormat: CaptionOutputFormat,
        file: FileCoordinate
    ) {
        this.outputFormat = outputFormat;
        this.insightType = insightType;
        this.file = file;
    }
}

export interface VCProcessProps {
    processId?: string;
    _id?: string;
    inputFileHash: string;
    inputFileId: string;
    inputFileLink?: string;
    insightAPIVersion: string;

    videoLength?: number;
    externalVideoId?: string;
    insightWaitingQueue?: string[];
    languageModelType: VCLanguageModelType;
    languageModelId: string;
    outputFiles?: VCOutput[];

    expiryTime?: Date;
    status?: VCRequestStatus;
    statusLog?: VCRequestLifecycleEvent[];
}

export class VCProcess {
    static serviceName: string = "VCProcess";

    processId?: string;
    inputFileHash: string;
    inputFileId: string;
    inputFileLink?: string;
    insightAPIVersion: string;

    videoLength?: number;
    externalVideoId?: string;
    insightWaitingQueue: string[];
    languageModelType: VCLanguageModelType;
    languageModelId: string;
    outputFiles: VCOutput[];

    expiryTime?: Date;
    status?: VCRequestStatus = VCRequestStatus.INITIATED;
    statusLog?: VCRequestLifecycleEvent[] = [
        new VCRequestLifecycleEvent(VCRequestStatus.INITIATED),
    ];

    constructor(props: VCProcessProps) {
        this.processId = props.processId || props._id;
        this.inputFileHash = props.inputFileHash;
        this.inputFileId = props.inputFileId;
        this.inputFileLink = props.inputFileLink;
        this.insightAPIVersion = props.insightAPIVersion;
        this.videoLength = props.videoLength;
        this.externalVideoId = props.externalVideoId;
        this.insightWaitingQueue = props.insightWaitingQueue || [];
        this.languageModelType = props.languageModelType;
        this.languageModelId = props.languageModelId;
        this.outputFiles = props.outputFiles || [];

        this.expiryTime = props.expiryTime;
        this.status = props.status;
        this.statusLog = props.statusLog;
    }

    public async persist() {
        const logger = loggerFactory(VCProcess.serviceName, "persist");
        try {
            const vcProcessInstance = await new VCProcessDBModel(this).save();
            this.processId = vcProcessInstance.id;
            return this;
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public static async findOrCreateVCProcess(props: VCProcessProps) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "findOrCreateVCProcess"
        );

        try {
            let vcProcess = await VCProcessDBModel.findOne({
                inputFileHash: props.inputFileHash,
                languageModelId: props.languageModelId,
                insightAPIVersion: props.insightAPIVersion,
            }).lean();

            if (vcProcess === null) {
                const vcProcessInstance = new VCProcess(props);
                await vcProcessInstance.persist();
                logger.info("creating new vc process: %o", vcProcessInstance);
                return vcProcessInstance;
            } else {
                const vcProcessInstance = new VCProcess(vcProcess);
                logger.info("using existing vc process: %o", vcProcessInstance);
                return vcProcessInstance;
            }
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public static async getVCProcessById(processId: string) {
        const logger = loggerFactory(VCProcess.serviceName, "getVCProcessById");

        try {
            const vcProcessInstance = await VCProcessDBModel.findById(
                processId
            );

            if (vcProcessInstance !== null) {
                return new VCProcess(vcProcessInstance);
            } else
                throw new VCProcessNotFoundError(
                    `VC process not found for id ${processId}`
                );
        } catch (error) {
            logger.error("encountered error: %o", error);
            throw error;
        }
    }

    public static async getVCProcessByExternalVideoId(videoId: string) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "getVCProcessByExternalVideoId"
        );

        try {
            const vcProcessInstance = await VCProcessDBModel.findOne({
                externalVideoId: videoId,
            }).exec();

            if (vcProcessInstance !== null) {
                return new VCProcess(vcProcessInstance);
            } else
                throw new VCProcessNotFoundError(
                    `VC process not found for id ${videoId}`
                );
        } catch (error) {
            logger.error("encountered error: %o", error);
            throw error;
        }
    }

    public async addVCRequest(vcRequestId: string) {
        const logger = loggerFactory(VCProcess.serviceName, "addVCRequest");
        try {
            logger.info(
                "adding request to waiting queue: " + vcRequestId + " "
            );

            this.insightWaitingQueue.push(vcRequestId);

            await VCProcessDBModel.findByIdAndUpdate(this.processId, {
                $push: {
                    insightWaitingQueue: vcRequestId,
                },
            }).exec();
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public async getWaitingRequestsAndUsers() {
        const results = this.insightWaitingQueue.map(async (vcRequestId) => {
            const vcRequest = await VcModel.getVCRequestById(vcRequestId);
            const user = await UserModel.getUserById(vcRequest?.userId || "");

            return {
                vcRequest,
                user,
            };
        });

        return await Promise.all(results);
    }

    public isVideoInsightExtractionComplete(): boolean {
        if (this.externalVideoId && this.outputFiles.length > 0) return true;

        return false;
    }

    public isVideoInsightExtractionInProgress(): boolean {
        return this.insightWaitingQueue?.length > 0 ? true : false;
    }

    public async changeStatusTo(newStatus: VCRequestStatus) {
        const logger = loggerFactory(VCProcess.serviceName, "changeStatusTo");
        logger.info(
            `changing status to ${newStatus} for vc process: ${this.processId}`
        );
        this.status = newStatus;
        const event = new VCRequestLifecycleEvent(newStatus);
        this.statusLog?.push(event);

        await VCProcessDBModel.findByIdAndUpdate(this.processId, {
            status: newStatus,
            $push: { statusLog: event },
        });

        return this;
    }

    public async clearWaitingQueue() {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "clearWaitingQueue"
        );
        logger.info("clearing the waiting queue");
        try {
            this.insightWaitingQueue.splice(0, this.insightWaitingQueue.length);
            await VCProcessDBModel.findByIdAndUpdate(this.processId, {
                insightWaitingQueue: [],
            }).exec();
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public async updateVideoId(videoId: string) {
        const logger = loggerFactory(VCProcess.serviceName, "updateVideoId");
        try {
            this.externalVideoId = videoId;
            await VCProcessDBModel.findByIdAndUpdate(this.processId, {
                externalVideoId: videoId,
            }).exec();
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public static getExpiryTime(videoLength: number) {
        return new Date(
            new Date().getTime() + Math.ceil(videoLength / 300) * 1800 * 1000
        );
    }

    public getVideoInsightResult(
        insightType: VideoExtractionType,
        outputFormat: CaptionOutputFormat
    ) {
        return this.outputFiles.filter(
            (result) =>
                result.outputFormat === outputFormat &&
                result.insightType === insightType
        )[0].file;
    }

    public startVCProcess(inputFile: FileModel) {
        VCRequestQueue.dispatch({
            vcProcessData: this,
            inputFile: inputFile,
        });
    }

    public async retrieveVideoInsightResults() {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "retrieveVideoInsightResults"
        );
        VcResponse.dispatch(this);
    }

    public async updateVideoInsightResult(
        insightType: VideoExtractionType,
        outputFormat: CaptionOutputFormat,
        outputFile: FileModel
    ) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "updateVideoInsightResult"
        );

        try {
            if (!this.outputFiles) {
                this.outputFiles = [];
            }

            const outputResult = new VCOutput(
                insightType,
                outputFormat,
                new FileCoordinate(
                    outputFile.container,
                    outputFile.fileKey,
                    outputFile.fileId
                )
            );
            this.outputFiles.push(outputResult);

            const vcProcess = await VCProcessDBModel.findByIdAndUpdate(
                this.processId,
                {
                    $push: {
                        outputFiles: outputResult,
                    },
                }
            ).exec();
        } catch (error) {
            logger.error(
                "couldn't update the converted file information %o",
                error
            );
        }
    }

    public async completeWaitingRequests() {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "completeWaitingRequests"
        );

        const failedRequestIds = this.insightWaitingQueue.filter(
            async (vcRequestId) => {
                const vcRequest = await VcModel.getVCRequestById(vcRequestId);
                for (const outputResult of this.outputFiles) {
                    if (
                        outputResult.insightType === vcRequest?.requestType &&
                        outputResult.outputFormat === vcRequest.outputFormat
                    ) {
                        await vcRequest?.performSuccessfulRequestCompletionPostActions(
                            VCRequestStatus.COMPLETED,
                            outputResult.file
                        );
                        return false;
                    } else return true;
                }
            }
        );

        const result = await Promise.all(failedRequestIds);

        if (result.length > 0) {
            this.insightWaitingQueue.splice(0, this.insightWaitingQueue.length);
            this.insightWaitingQueue.push(...result);
            this.notifyVCProcessFailure(
                null,
                "output results missing for vcRequestIds",
                500,
                "output results missing for vcRequestIds: " + result.join("\n"),
                `Error while processing vc Process ${this.processId} for input file: ${this.inputFileId}`,
                "unimplemented",
                VCRequestStatus.INSIGHT_FAILED
            );
        }
    }

    public async notifyVCProcessFailure(
        file: FileModel | null,
        response: any,
        code: number,
        reason: string,
        stackTrace: string,
        correlationId: string,
        failureStatus: VCRequestStatus
    ) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "notifyVCProcessFailure"
        );

        this.changeStatusTo(failureStatus);

        const waitingRequests = await this.notifyWaitingUsersAboutFailure(
            failureStatus
        );

        VCProcess.notifyIStemTeamAboutVCProcessFailure(
            ExceptionMessageTemplates.getVideoInsightAPIFailureMessage({
                code: code,
                reason: reason,
                stackTrace: stackTrace,
                correlationId: "to be implemented",
                modelId: this.languageModelId || "",
                inputFileId: this.inputFileId,
                inputURL: file?.inputURL,
                vcProcessId: this.processId,
                users: waitingRequests.map((waitingRequest) => {
                    return {
                        name: waitingRequest.user?.fullname,
                        email: waitingRequest.user?.email,
                        insightType: waitingRequest.vcRequest?.requestType,
                        outputFormat: waitingRequest.vcRequest?.outputFormat,
                    };
                }),
            })
        );

        this.clearWaitingQueue();
    }

    public static async notifyIStemTeamAboutVCProcessFailure(
        message: MessageModel
    ) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "notifyIStemAboutVCProcessFailure"
        );

        EmailService.sendInternalDiagnosticEmail(message);
    }

    public async notifyWaitingUsersAboutFailure(
        failureStatus: VCRequestStatus
    ) {
        const results = this.insightWaitingQueue.map(async (vcRequestId) => {
            const vcRequest = await VcModel.getVCRequestById(vcRequestId);
            const user = await UserModel.getUserById(vcRequest?.userId || "");

            if (user !== null) {
                if (
                        vcRequest?.resultType ===
                            HandleAccessibilityRequests.AUTO
                ) {
                    await EmailService.sendEmailToUser(
                        user,
                        ExceptionMessageTemplates.getVCFailureMessageForUser({
                            documentName: vcRequest?.documentName || "",
                            user: user.fullname,
                        })
                    );
                }
            }
            vcRequest?.changeStatusTo(failureStatus);

            return {
                vcRequest,
                user,
            };
        });

        return await Promise.all(results);
    }

    public static async notifyErrorInVCProcessFlow(
        file: FileModel | null,
        response: any,
        reason: string,
        stackTrace: string,
        correlationId: string,
        failureStatus: VCRequestStatus
    ) {
        const logger = loggerFactory(
            VCProcess.serviceName,
            "notifyErrorInVCProcessFlow"
        );

        EmailService.sendInternalDiagnosticEmail(
            ExceptionMessageTemplates.getVideoInsightAPIFailureMessage({
                reason: reason,
                code: response?.statusCode ? response?.statusCode : 500,
                stackTrace: stackTrace,
                inputFileId: file?.fileId || "",
                inputURL: file?.inputURL,
            })
        );
    }

    public static getOutputZipFileName(
        insightType: VideoExtractionType,
        captionOutputFormat: CaptionOutputFormat
    ) {
        if (insightType === VideoExtractionType.OCR_CAPTION) {
            if (captionOutputFormat === CaptionOutputFormat.SRT)
                return VideoExtractionType.OCR_CAPTION + "_WITH_SRT.zip";
            else return VideoExtractionType.OCR_CAPTION + "_WITH_TXT.zip";
        } else {
            return `${insightType}.${captionOutputFormat}`;
        }
    }
}
