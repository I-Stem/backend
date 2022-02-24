import VcDbModel from "../../models/VC";
import loggerFactory from "../../middlewares/WinstonLogger";
import LedgerModel from "../LedgerModel";
import MessageQueue from "../../queues/message";
import ReviewModel from "../ReviewModel";
import UserModel from "../user/User";
import EmailService from "../../services/EmailService";
import ServiceRequestTemplates from "../../MessageTemplates/ServiceRequestTemplates";
import { getFormattedJson } from "../../utils/formatter";
import ExceptionMessageTemplates from "../../MessageTemplates/ExceptionTemplates";
import FileModel, {FileCoordinate} from "../FileModel";
import {VCRequestStatus, VideoExtractionType, CaptionOutputFormat} from "./VCConstants";
import {HandleAccessibilityRequests} from "../organization/OrganizationConstants";
import {calculateNumbersInRange} from "../../utils/library";
import {VCProcess} from "../VCProcess";

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
    associatedProcessId?: string;
    userId: string;
    organizationCode: string;
    documentName: string;
    requestType: VideoExtractionType;
    inputFileId: string;
    modelId?: string;
    tag?: string;
    outputURL?: string;
    outputFile?: FileCoordinate;
    inputFileLink: string;
    videoLength?: number;
    review?: ReviewModel;
    reviews?: ReviewModel[];
    status: VCRequestStatus;
    statusLog?: VCRequestLifecycleEvent[];
    outputFormat?: CaptionOutputFormat;
    escalationId?: string;
    expiryTime?: Date;
    otherRequests?: string;
    resultType?: HandleAccessibilityRequests;
    secsForRemediation?: string;
}

export class VcModel {
    static serviceName = "VcModel";

    vcRequestId: string;
    associatedProcessId?: string;
    userId: string;
    organizationCode: string;
    documentName: string;
    requestType: VideoExtractionType;
    inputFileId: string;
    videoLength: number = 0;
    modelId?: string;
    tag?: string;
    outputURL?: string;
    outputFile?: FileCoordinate;
    inputFileLink: string;
    review?: ReviewModel;
    reviews: ReviewModel[];
    status: VCRequestStatus;
    statusLog?: VCRequestLifecycleEvent[];
    outputFormat?: CaptionOutputFormat;
    escalationId?: string;
    expiryTime?: Date;
    otherRequests?: string;
    resultType?: HandleAccessibilityRequests;
    secsForRemediation?: string;

    constructor(props: VCProps) {
        this.vcRequestId = props.vcRequestId || props._id || "";
        this.associatedProcessId = props.associatedProcessId;
        this.userId = props.userId;
        this.organizationCode = props.organizationCode;
        this.documentName = props.documentName;
        this.requestType = props.requestType;
        this.inputFileId = props.inputFileId;
        this.modelId = props.modelId || undefined;
        this.tag = props.tag || undefined;
        this.videoLength = props.videoLength || 0;
        this.outputURL = props.outputURL || "";
        this.outputFile = props.outputFile;
        this.inputFileLink = props.inputFileLink;
        this.review = props.review;
        this.reviews = props.reviews || [];
        this.status = props.status;
        this.statusLog = props.statusLog || [
            new VCRequestLifecycleEvent(props.status),
        ];
        this.outputFormat = props.outputFormat || CaptionOutputFormat.TXT;
        this.escalationId = props.escalationId;
        this.expiryTime = props.expiryTime;
        this.otherRequests = props.otherRequests;
        this.resultType = props.resultType;
        this.secsForRemediation = props.secsForRemediation;
    }

    async persist() {
        const logger = loggerFactory(VcModel.serviceName, "persist");
        logger.info("persisting vc request data: %o", this);
        try {
            const vcSaved = await new VcDbModel(this).save();
            this.vcRequestId = vcSaved._id;
            return this;
        } catch (error) {
            logger.error("error occurred while persisting: %o", error);
            return null;
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

    public async updateOutputResult(outputFileCoordinate: FileCoordinate) {
        let outputFormat: CaptionOutputFormat | undefined = undefined;
        if(this.resultType === HandleAccessibilityRequests.MANUAL) {
        const file = await FileModel.getFileById(outputFileCoordinate.fileId || "");
        outputFormat = file?.name.substr(file?.name.lastIndexOf(".")+1).toUpperCase() as CaptionOutputFormat;
        }
        this.outputURL = `/file/vc/${this.vcRequestId}`;
        this.outputFile = outputFileCoordinate;
        await VcDbModel.findByIdAndUpdate(this.vcRequestId, {
            outputURL: this.outputURL,
            outputFile: outputFileCoordinate,
            outputFormat: outputFormat
        }).lean();
    }

    public async chargeUserForRequest() {

        let charge_for_request = 0;

        let message = "";
        if(this.resultType === HandleAccessibilityRequests.AUTO) {
charge_for_request = Math.ceil (this.videoLength/10);
message = "Audio/Video accessibility of file: " + this.documentName;
        } else {
            charge_for_request = Math.ceil((calculateNumbersInRange(this.secsForRemediation || "")/60)*25);
            message = "Manual remediation of file: " + this.documentName
        }
        await LedgerModel.createDebitTransaction(
            this.userId,
            charge_for_request,
            message
        );

        return false;
    }

    public async notifyUserForResults() {
        const logger = loggerFactory(
            VcModel.serviceName,
            "notifyUserForResults"
        );
        const user = await UserModel.getUserById(this.userId);
        if (user !== null) {
                    if(this.resultType === HandleAccessibilityRequests.AUTO) {
                await EmailService.sendEmailToUser(
                    user,
                    ServiceRequestTemplates.getServiceRequestComplete({
                        userName: user.fullname,
                        userId: user.userId,
                        outputURL: this.outputURL || "",
                        documentName: this.documentName,
                    })
                );
            }
        } else {
            logger.error("couldn't get user by id: " + this.userId);
        }
    }

    public async performSuccessfulRequestCompletionPostActions(
        finalSuccessStatus: VCRequestStatus,
        outputFileCoordinate: FileCoordinate
    ) {
        const updateStatus = this.changeStatusTo(finalSuccessStatus);
        const updateResult = this.updateOutputResult(outputFileCoordinate);
        const deductCredits = this.chargeUserForRequest();
        const notifyUser = this.notifyUserForResults();
        return await Promise.all([
            updateStatus,
            updateResult,
            deductCredits,
            notifyUser,
        ]);
    }

    public static async saveReview(
        vcRequestId: string,
        review: ReviewModel
    ): Promise<VcModel | null> {
        return new VcModel(await VcDbModel.findOneAndUpdate(
            { _id: vcRequestId },
            { $push: { reviews: review }, review: review },
            { new: true }
        ).lean());
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

    /*
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
                            //FileModel.vcInputFileHandler(vcReq);
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
*/

    public static async updateEscalatedVcRequestWithRemediatedFile(
        vcId: string,
        remediatedFile: FileCoordinate
    ) {
        await VcDbModel.findByIdAndUpdate(vcId, { outputFile: remediatedFile });
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

    public async initiateVCProcessForRequest(
        vcProcess: VCProcess,
        inputFile: FileModel
    ) {
        if (vcProcess?.isVideoInsightExtractionComplete()) {
            if (this.outputFormat) {
                const outputFile = vcProcess.getVideoInsightResult(
                    this.requestType,
                    this.outputFormat
                );
                this.performSuccessfulRequestCompletionPostActions(
                    VCRequestStatus.COMPLETED,
                    outputFile
                );
            }
        } else if (vcProcess.isVideoInsightExtractionInProgress()) {
            vcProcess.addVCRequest(this.vcRequestId);
        } else {
            vcProcess.startVCProcess(inputFile);
            vcProcess.addVCRequest(this.vcRequestId);
        }
    }
}

