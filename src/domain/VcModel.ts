import VcDbModel from "../models/VC";
import loggerFactory from "../middlewares/WinstonLogger";
import LedgerModel from "./LedgerModel";
import MessageQueue from "../queues/message";
import ReviewModel from "./ReviewModel";
import UserModel from "./user/User";
import EmailService from "../services/EmailService";
import ServiceRequestTemplates from "../MessageTemplates/ServiceRequestTemplates";
import { getVideoDurationInSeconds } from "get-video-duration";
import { getFormattedJson } from "../utils/formatter";
import ExceptionMessageTemplates from "../MessageTemplates/ExceptionTemplates";
import FileModel from "./FileModel";

export const enum VideoExtractionType {
    CAPTION = "CAPTION",
    OCR = "OCR",
    OCR_CAPTION = "OCR_CAPTION",
}

export const enum CaptionOutputFormat {
    SRT = "srt",
    TXT = "txt",
}

export const enum VCRequestStatus {
    INITIATED = "INITIATED",
    INDEXING_REQUESTED = "INDEXING_REQUESTED",
    INDEXING_REQUEST_FAILED = "INDEXING_REQUEST_FAILED",
    INDEXING_SKIPPED = "INDEXING_SKIPPED",
    CALLBACK_RECEIVED = "CALLBACK_RECEIVED",
    INDEXING_API_FAILED = "INDEXING_API_FAILED",
    INSIGHT_REQUESTED = "INSIGHT_REQUESTED",
    INSIGHT_FAILED = "INSIGHT_FAILED",
    COMPLETED = "COMPLETED",
    ESCALATION_REQUESTED = "ESCALATION_REQUESTED",
    ESCALATION_RESOLVED = "ESCALATION_RESOLVED",
    RETRY_REQUESTED = "RETRY_REQUESTED",
    RESOLVED_FILE_USED = "RESOLVED_FILE_USED",
}

export class VCRequestLifecycleEvent {
    status: VCRequestStatus;
    actionAt: Date;

    constructor(status: VCRequestStatus, actionAt: Date = new Date()) {
        this.status = status;
        this.actionAt = actionAt;
    }
}

export interface VCProps {
    vcRequestId?: string;
    _id?: string;
    userId: string;
    documentName: string;
    requestType: VideoExtractionType;
    inputFileId: string;
    modelId?: string;
    tag?: string;
    outputURL?: string;
    videoLength?: number;
    review?: ReviewModel;
    reviews?: ReviewModel[];
    status: VCRequestStatus;
    statusLog?: VCRequestLifecycleEvent[];
    outputFormat?: CaptionOutputFormat;
    expiryTime?: Date;
}

class VcModel {
    static serviceName = "VcModel";

    vcRequestId: string;
    userId: string;
    documentName: string;
    requestType: VideoExtractionType;
    inputFileId: string;
    videoLength: number = 0;
    modelId?: string;
    tag?: string;
    outputURL?: string;
    review?: ReviewModel;
    reviews: ReviewModel[];
    status: VCRequestStatus;
    statusLog?: VCRequestLifecycleEvent[];
    outputFormat?: CaptionOutputFormat;
    expiryTime?: Date;

    constructor(props: VCProps) {
        this.vcRequestId = props.vcRequestId || props._id || "";
        this.userId = props.userId;
        this.documentName = props.documentName;
        this.requestType = props.requestType;
        this.inputFileId = props.inputFileId;
        this.modelId = props.modelId || undefined;
        this.tag = props.tag || undefined;
        this.videoLength = props.videoLength || 0;
        this.outputURL = props.outputURL || "";
        this.review = props.review;
        this.reviews = props.reviews || [];
        this.status = props.status;
        this.statusLog = props.statusLog || [
            new VCRequestLifecycleEvent(props.status),
        ];
        this.outputFormat = props.outputFormat || CaptionOutputFormat.TXT;
        this.expiryTime = props.expiryTime;
    }

    async persist(): Promise<boolean | VcModel> {
        const logger = loggerFactory(VcModel.serviceName, "persist");
        logger.info("persisting vc request data: %o", this);
        try {
            const vcSaved = await (
                await new VcDbModel(this).save()
            ).execPopulate();
            this.vcRequestId = vcSaved._id;
            return this;
        } catch (error) {
            logger.error("error occurred while persisting: %o", error);
            return false;
        }
    }

    public async changeStatusTo(newStatus: VCRequestStatus) {
        const logger = loggerFactory(VcModel.serviceName, "changeStatusTo");
        logger.info(
            `changing status to ${newStatus} for vc Request: ${this.vcRequestId}`
        );
        this.status = newStatus;
        const event = new VCRequestLifecycleEvent(newStatus);
        this.statusLog?.push(event);

        await VcDbModel.findByIdAndUpdate(this.vcRequestId, {
            status: newStatus,
            $push: { statusLog: event },
        });

        return this;
    }

    public static async averageResolutionTime(userId: string) {
        const logger = loggerFactory(
            VcModel.serviceName,
            "averageResolutionTime"
        );
        const request = await VcDbModel.find({ userId }).lean();
        let totalTime = 0;
        request.forEach((element: any) => {
            totalTime += element.updatedAt - element.createdAt;
        });
        logger.info(
            `Average resolution time for ${userId}: ${
                totalTime / request.length
            }`
        );
        return totalTime / request.length;
    }

    public async updateOutputURLAndVideoLength(
        outputURL: string,
        videoLength: number
    ) {
        this.outputURL = outputURL;
        this.videoLength = videoLength;

        await VcDbModel.findByIdAndUpdate(this.vcRequestId, {
            outputURL: outputURL,
            videoLength: videoLength,
        }).lean();
    }

    public async chargeUserForRequest() {
        await LedgerModel.createDebitTransaction(
            this.userId,
            this.videoLength / 10,
            "Audio/Video accessibility of file: " + this.documentName
        );
    }

    public async notifyUserForResults() {
        const logger = loggerFactory(
            VcModel.serviceName,
            "notifyUserForResults"
        );
        const user = await UserModel.getUserById(this.userId);
        if (user !== null) {
            await EmailService.sendEmailToUser(
                user,
                ServiceRequestTemplates.getServiceRequestComplete({
                    userName: user.fullname,
                    userId: user.userId,
                    outputURL: this.outputURL || "",
                    documentName: this.documentName,
                })
            );
        } else {
            logger.error("couldn't get user by id: " + this.userId);
        }
    }

    public static async saveReview(
        vcRequestId: string,
        review: ReviewModel
    ): Promise<VcModel | null> {
        return VcDbModel.findOneAndUpdate(
            { _id: vcRequestId },
            { $push: { reviews: review }, review: review },
            { new: true }
        ).lean();
    }

    public static async getVCRequestById(vcRequestId: string) {
        const vcData = await VcDbModel.findById(vcRequestId).lean();
        if (vcData !== null) {
            return new VcModel(vcData);
        } else {
            return null;
        }
    }

    public static getVcRequestCountForUser(userId: string): Promise<number> {
        const logger = loggerFactory(
            VcModel.serviceName,
            "getVcRequestCountForUser"
        );
        return VcDbModel.countDocuments({ userId: userId }).exec();
    }

    public static async getCustomModelVcRequestCount(
        userId: string
    ): Promise<number> {
        return VcDbModel.countDocuments({
            userId: userId,
            modelName: { $ne: "standard-@" },
        }).exec();
    }

    public static async getVcEscalatedRequestCountForUser(
        userId: string
    ): Promise<number> {
        return VcDbModel.countDocuments({
            userId: userId,
            $and: [
                {
                    $or: [
                        { status: VCRequestStatus.ESCALATION_REQUESTED },
                        { status: VCRequestStatus.ESCALATION_RESOLVED },
                    ],
                },
            ],
        }).exec();
    }

    public static async getAllVcActivityForUser(userId: string) {
        return VcDbModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getCompletedVcRequestForUser(userId: string) {
        return VcDbModel.find({
            userId,
            status: VCRequestStatus.COMPLETED,
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getEscalatedVcRequestForUser(userId: string) {
        return VcDbModel.find({
            userId,
            $and: [
                {
                    $or: [
                        { status: VCRequestStatus.ESCALATION_REQUESTED },
                        { status: VCRequestStatus.ESCALATION_RESOLVED },
                    ],
                },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getActiveVcRequestForUser(userId: string) {
        return VcDbModel.find({
            userId,
            status: { $ne: VCRequestStatus.COMPLETED },
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getVcRatingCountForUser(userId: string) {
        let rating = 0;
        let count = 0;
        await VcDbModel.find({ userId: userId })
            .exec()
            .then((vcRequest) => {
                vcRequest.forEach((vc) => {
                    if (vc?.reviews?.length) {
                        if (
                            !isNaN(
                                Number(
                                    vc.reviews[vc.reviews.length - 1].ratings
                                )
                            )
                        ) {
                            count += 1;
                            rating += Number(
                                vc.reviews[vc.reviews.length - 1].ratings
                            );
                        }
                    }
                });
            });
        return { count, rating };
    }

    public static async setExpiryTime(
        duration: number,
        requestId: string,
        creationTime: number
    ): Promise<void> {
        const expiryTime = new Date(
            creationTime + Math.ceil(duration / 300) * 1800 * 1000
        );
        await VcDbModel.findByIdAndUpdate(requestId, { expiryTime });
    }

    public static async updateVideoLength(
        url: string,
        requestId: string
    ): Promise<any> {
        let videoLength = 0;
        videoLength = Math.ceil(await getVideoDurationInSeconds(url));
        const vc = await VcDbModel.findByIdAndUpdate(requestId, {
            videoLength,
        });
        const creationTime = new Date(
            ((vc as unknown) as any).createdAt
        ).getTime();
        await VcModel.setExpiryTime(videoLength, requestId, creationTime);
    }
    public static vcCronHandler(
        expiryTimeGTE: string,
        expiryTimeLTE: string
    ): void {
        const logger = loggerFactory(VcModel.serviceName, "vcCronHandler");
        const failedRequests: string[] = [];
        VcDbModel.find({
            expiryTime: {
                $gte: new Date(expiryTimeGTE),
                $lte: new Date(expiryTimeLTE),
            },
        })
            .exec()
            .then((vc) => {
                const status = [
                    VCRequestStatus.INITIATED,
                    VCRequestStatus.INDEXING_REQUESTED,
                    VCRequestStatus.INDEXING_SKIPPED,
                    VCRequestStatus.CALLBACK_RECEIVED,
                    VCRequestStatus.INSIGHT_REQUESTED,
                ];
                let pendingStatus = false;
                if (vc) {
                    vc.forEach((vcReq) => {
                        pendingStatus = status.some(
                            (vcStatus) => vcStatus === vcReq.status
                        );
                        if (pendingStatus) {
                            logger.info("Failing requests found");
                            FileModel.vcInputFileHandler(vcReq);
                            failedRequests.push(getFormattedJson(vcReq));
                        }
                    });
                }
                if (!pendingStatus) {
                    logger.info(
                        `No failed VC Request found during cron sweep for for interval ${expiryTimeGTE} and ${expiryTimeLTE}`
                    );
                } else {
                    logger.info("notifying I-Stem for failures");
                    EmailService.sendInternalDiagnosticEmail(
                        ExceptionMessageTemplates.getVCFailureMessage({
                            data: failedRequests,
                            timeInterval: [expiryTimeGTE, expiryTimeLTE],
                        })
                    );
                }
            });
    }

    public static async updateEscalatedVcRequestWithRemediatedFile(
        vcId: string,
        url: string
    ) {
        await VcDbModel.findByIdAndUpdate(vcId, { outputURL: url });
    }

    public static async updateVcStatusById(
        vcId: string,
        status: VCRequestStatus
    ): Promise<any> {
        await VcDbModel.findByIdAndUpdate(vcId, {
            status,
            $push: {
                statusLog: new VCRequestLifecycleEvent(status, new Date()),
            },
        }).exec();
    }
}

export default VcModel;
