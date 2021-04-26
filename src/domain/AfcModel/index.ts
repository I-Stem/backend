import AfcDbModel from "../../models/AFC";
import ReviewModel from "../ReviewModel";
import loggerFactory from "../../middlewares/WinstonLogger";
import FileModel, {FileCoordinate} from "../FileModel";
import { getFormattedJson } from "../../utils/formatter";
import EmailService from "../../services/EmailService";
import ExceptionMessageTemplates from "../../MessageTemplates/ExceptionTemplates";
import emailService from "../../services/EmailService";
import UserModel from "../user/User";
import {NoSuchUserError} from "../user/UserDomainErrors";
import LedgerModel from "../LedgerModel";
import ServiceRequestTemplates from "../../MessageTemplates/ServiceRequestTemplates";
import {AFCRequestStatus, DocType, AFCRequestOutputFormat, AFCTriggerer} from "./AFCConstants";
import {HandleAccessibilityRequests} from "../organization/OrganizationConstants";
import {calculateNumbersInRange} from "../../utils/library";
import AfcRequestQueue from "../../queues/afcRequest";
import MLModelQueue from "../../queues/MLModelQueue";
import {AFCProcess} from "../AFCProcess";

export class AFCRequestLifecycleEvent {
    status: AFCRequestStatus;
    actionAt: Date;

    constructor(status: AFCRequestStatus, actionedAt: Date = new Date()) {
        this.status = status;
        this.actionAt = actionedAt;
    }
}

export interface AFCRequestProps {
    _id?: string;
    afcRequestId?: string;
    associatedProcessId?: string;
    userId: string;
    organizationCode: string;
    inputFileId: string;
    outputURL?: string;
    documentName: string;
    pageCount?: number;
    docType: DocType;
    status?: AFCRequestStatus;
    statusLog?: AFCRequestLifecycleEvent[];
    outputFormat: AFCRequestOutputFormat;
    tag?: string;
    escalationId?: string;
    reviews?: ReviewModel[];
    triggeredBy: AFCTriggerer;
    triggeringCaseId?: string;
    inputFileLink?: string;
    outputFile?: FileCoordinate;
    otherRequests?: string;
    resultType?: HandleAccessibilityRequests;
    pagesForRemediation?: string;
}

export class AfcModel implements AFCRequestProps {
    static serviceName = "AfcModel";

    afcRequestId: string;
    associatedProcessId: string;
    userId: string;
    organizationCode: string;
    inputFileId: string;
    outputURL?: string;
    documentName: string = "";
    pageCount: number;
    docType: DocType = DocType.NONMATH;
    status: AFCRequestStatus = AFCRequestStatus.REQUEST_INITIATED;
    statusLog: AFCRequestLifecycleEvent[] = [
        new AFCRequestLifecycleEvent(AFCRequestStatus.REQUEST_INITIATED),
    ];
    outputFormat: AFCRequestOutputFormat;
    tag?: string;
    escalationId?: string;
    reviews?: ReviewModel[] = [];
    triggeredBy: AFCTriggerer = AFCTriggerer.USER;
    triggeringCaseId?: string;
    inputFileLink?: string;
    outputFile?: FileCoordinate;
    otherRequests?: string;
    resultType?: HandleAccessibilityRequests;
    pagesForRemediation?: string;

    constructor(props: AFCRequestProps) {
        this.afcRequestId = props.afcRequestId || props._id || "";
        this.associatedProcessId = props.associatedProcessId || "";
        this.inputFileId = props.inputFileId;
        this.outputFormat = props.outputFormat;
        this.outputFile = props.outputFile;
        this.outputURL = props.outputURL;
        this.userId = props.userId;
        this.organizationCode = props.organizationCode;
        this.documentName = props.documentName;
        this.triggeredBy = props.triggeredBy;
        this.triggeringCaseId = props.triggeringCaseId;
        this.status = props.status || AFCRequestStatus.REQUEST_INITIATED;
        this.statusLog = props.statusLog || [];
        this.pageCount = props.pageCount || 0;
        this.docType = props.docType;
        this.tag = props.tag;
        this.escalationId = props.escalationId;
        this.reviews = props.reviews;
        this.inputFileLink = props.inputFileLink;
        this.otherRequests = props.otherRequests;
        this.resultType = props.resultType;
        this.pagesForRemediation = props.pagesForRemediation;
    }

    public static async createAndPersist(props: AFCRequestProps) {
        const logger = loggerFactory(AfcModel.serviceName, "createAndPersist");
        let request = new AfcModel(props);
        request.statusLog.push(new AFCRequestLifecycleEvent(request.status));
        const result = await new AfcDbModel(request).save();

        logger.info("got afc request id after creation: " + result._id);
        request.afcRequestId = result._id;

        return request;
    }

    public async persist() {
        const logger = loggerFactory(AfcModel.serviceName, "persist");

        try {
            const result = await new AfcDbModel(this).save();
this.afcRequestId= result.id;
            return this;
        } catch (error) {
            logger.error("couldn't persist afc request data: %o", error);
        }

        return null;
    }

    public static async averageResolutionTime(userId: string) {
        const logger = loggerFactory(
            AfcModel.serviceName,
            "averageResolutionTime"
        );
        const request = await AfcDbModel.find({ userId }).lean();
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

    public async changeStatusTo(newStatus: AFCRequestStatus) {
        const logger = loggerFactory(AfcModel.serviceName, "changeStatusTo");
        logger.info(
            `Changing status to: ${newStatus} of request: ${this.afcRequestId}`
        );
        this.status = newStatus;
        const event = new AFCRequestLifecycleEvent(newStatus);
        this.statusLog.push(event);

        await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
            status: newStatus,
            $push: { statusLog: event },
        });

        return this;
    }

    public async updateTriggeringCaseId(triggererId: string) {
        this.triggeringCaseId = triggererId;
        return AfcDbModel.findByIdAndUpdate(
            this.afcRequestId,
            { triggeringCaseId: triggererId },
            { new: true }
        ).lean();
    }

    public async updateFormattingResults(outputFile: FileCoordinate) {
        this.outputURL = `/file/afc/${this.afcRequestId}`;
        this.outputFile = outputFile;
        return await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
            outputURL: this.outputURL,
            outputFile: outputFile,
        }).lean();
    }

    public async completeAFCRequestProcessing(outputFile: FileCoordinate) {
        const logger = loggerFactory(
            AfcModel.serviceName,
            "completeAFCRequestProcessing"
        );

        await this.updateFormattingResults(outputFile);
        if (this.triggeredBy === AFCTriggerer.USER) {
            if(this.resultType === HandleAccessibilityRequests.AUTO) {
                const chargeUser = AfcModel.chargeUserForService(
                    this.userId,
                    this.pageCount || 0,
                    "Document accessibility conversion of file:" + this.documentName
                );
                const sendEmail = this.sendServiceCompleteEmailToUser();
                await Promise.all([chargeUser, sendEmail]);
                } else if(this.status === AFCRequestStatus.RESOLVED_FILE_USED) {
const pagesRemediated = calculateNumbersInRange(this.pagesForRemediation || "");

const file = await FileModel.getFileById(outputFile.fileId || "");
//hard coding output file format to be same as remediated file
await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
    outputFormat: file?.name.substr(file?.name.lastIndexOf(".")+1).toUpperCase() as AFCRequestOutputFormat || AFCRequestOutputFormat.WORD
});
                    const chargeUser = AfcModel.chargeUserForService(
                        this.userId,
                        pagesRemediated * Number(process.env.REMEDIATION_CREDITS_PER_PAGE),
                        "Manual remediation of file:" + this.documentName
                    );
                    const sendEmail = this.sendServiceCompleteEmailToUser();
                }
        } else {
            logger.info("Triggereing video captioning model training flow");

            await LedgerModel.createDebitTransaction(
                this.userId,
                this.pageCount || 0,
                "custom language model training"
            );

            MLModelQueue.dispatch(this);
        }
    }

    public static async saveReview(
        afcRequestId: string,
        review: ReviewModel
    ): Promise<AfcModel | null> {
        return AfcDbModel.findOneAndUpdate(
            { _id: afcRequestId },
            { $push: { reviews: review }, review: review },
            { new: true }
        ).lean();
    }

    public static async getAfcModelById(id: string) {
        const logger = loggerFactory(AfcModel.serviceName, "getAfcModelById");
        const afcDbRequest = await AfcDbModel.findById(id).lean();

        if (afcDbRequest !== null) {
            const afcRequest = new AfcModel(afcDbRequest);
            logger.info("retrieved afc model: %o", afcRequest.afcRequestId);
            return afcRequest;
        }
        return null;
    }

    public static async getAfcRequestCountForUser(
        userId: string
    ): Promise<number> {
        return AfcDbModel.countDocuments({ userId: userId }).exec();
    }

    public static async getAfcEscalatedRequestsForUser(
        userId: string
    ): Promise<number> {
        return AfcDbModel.countDocuments({
            userId: userId,
            status: AFCRequestStatus.ESCALATION_REQUESTED,
        }).exec();
    }

    public static async getAllAfcActivityForUser(userId: string) {
        return AfcDbModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getCompletedAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            status: AFCRequestStatus.FORMATTING_COMPLETED,
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getEscalatedAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            $and: [
                {
                    $or: [
                        { status: AFCRequestStatus.ESCALATION_REQUESTED },
                        { status: AFCRequestStatus.ESCALATION_RESOLVED },
                    ],
                },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getActiveAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            status: { $ne: AFCRequestStatus.FORMATTING_COMPLETED },
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    public static async getAfcRatingCountForUser(userId: string) {
        let rating = 0;
        let count = 0;
        await AfcDbModel.find({ userId: userId })
            .exec()
            .then((afcRequests) => {
                afcRequests.forEach((afc) => {
                    if (afc?.reviews?.length) {
                        if (
                            !isNaN(
                                Number(
                                    afc.reviews[afc.reviews.length - 1].ratings
                                )
                            )
                        ) {
                            rating += Number(
                                afc.reviews[afc.reviews.length - 1].ratings
                            );
                            count += 1;
                        }
                    }
                });
            });
        return { count, rating };
    }

    public static sendAfcFailureMessageToUser(
        user: UserModel,
        afcRequest: AfcModel
    ) {
        emailService.sendEmailToUser(
            user,
            ExceptionMessageTemplates.getFailureMessageForUser({
                user,
                data: afcRequest,
            })
        );
    }

    public static async updateEscalatedAfcRequestWithRemediatedFile(
        afcId: string,
         remediatedFile: FileCoordinate
    ) {
        await AfcDbModel.findByIdAndUpdate(afcId, { outputFile: remediatedFile});
    }

    public static async updateAfcStatusById(
        afcId: string,
        status: AFCRequestStatus
    ): Promise<any> {
        await AfcDbModel.findByIdAndUpdate(afcId, {
            status,
            $push: {
                statusLog: new AFCRequestLifecycleEvent(
                    AFCRequestStatus.ESCALATION_RESOLVED,
                    new Date()
                ),
            },
        }).exec();
    }

    public async initiateAFCProcessForRequest(
        afcProcess: AFCProcess,
        inputFile: FileModel
    ) {
        if (afcProcess?.isOCRComplete()) {
            await afcProcess.addAFCRequest(this.afcRequestId);
            afcProcess.formatOutput();
        } else if (afcProcess.isOCRInProgress()) {
            afcProcess.addAFCRequest(this.afcRequestId);
        } else {
            AfcRequestQueue.dispatch({
                afcProcessData: afcProcess,
                inputFile: inputFile,
            });
            afcProcess.addAFCRequest(this.afcRequestId);
        }
    }

    public static async chargeUserForService(
        userId: string,
        amount: number,
        reason: string
    ): Promise<void> {
        await LedgerModel.createDebitTransaction(userId, amount, reason);
    }

    public async sendServiceCompleteEmailToUser(): Promise<void> {
        const logger = loggerFactory(AfcModel.serviceName, "sendServiceCompleteEmailToUser");
        try {
            const user = await UserModel.getUserById(this.userId);
            if(user !== null) {
        await emailService.sendEmailToUser(
            user,
            ServiceRequestTemplates.getServiceRequestComplete({
                documentName: this.documentName,
                outputURL: this.outputURL || "",
                userName: user.fullname,
                userId: user.userId,
            })
        );
            } 
            else
            throw new NoSuchUserError(`couldn't get user by id: ${this.userId} found while sending email for afc id: ${this.afcRequestId}`);
        } catch(error) {
            logger.error("error: %o", error);
        }
    }

}


