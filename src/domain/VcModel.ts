import VcDbModel from "../models/VC";
import loggerFactory from "../middlewares/WinstonLogger";
import LedgerModel from "./LedgerModel";
import MessageQueue from "../queues/message";
import ReviewModel from "./ReviewModel";
import UserModel from "./user/User";
import EmailService from "../services/EmailService";
import ServiceRequestTemplates from "../MessageTemplates/ServiceRequestTemplates";
import got from "got/dist/source";

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
    }

    async persist(): Promise<boolean> {
        const logger = loggerFactory(VcModel.serviceName, "persist");
        logger.info("persisting vc request data: %o", this);
        try {
            const vcSaved = await (
                await new VcDbModel(this).save()
            ).execPopulate();
            this.vcRequestId = vcSaved._id;
        } catch (error) {
            logger.error("error occurred while persisting: %o", error);
            return false;
        }

        return true;
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
            totalTime += (element.updatedAt - element.createdAt);
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
        return VcDbModel.find({ userId: userId }).lean();
    }

    public static async getCompletedVcRequestForUser(userId: string) {
        return VcDbModel.find({
            userId,
            status: VCRequestStatus.COMPLETED,
        }).lean();
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
        }).lean();
    }

    public static async getActiveVcRequestForUser(userId: string) {
        return VcDbModel.find({
            userId,
            status: { $ne: VCRequestStatus.COMPLETED },
        }).lean();
    }

    public static async getVcRatingCountForUser(userId: string) {
        let rating = 0;
        let count = 0;
        await VcDbModel.find({ userId: userId })
            .exec()
            .then((vcRequest) => {
                
                vcRequest.forEach((vc) => {
                    if (vc?.reviews?.length) {
                        count = vc?.reviews?.length;
                        rating += Number(vc.reviews[vc.reviews.length - 1].rating);
                    }
                });
            });
        return { count, rating };
    }
}

export default VcModel;
