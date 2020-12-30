import { plainToClass } from 'class-transformer';
import AfcDbModel from '../models/AFC';
import ReviewModel from './ReviewModel';
import loggerFactory from '../middlewares/WinstonLogger';
import { User } from '@lip/models';
import afcRequest from 'src/queues/afcRequest';
import FileModel from './FileModel';
import { getFormattedJson } from '../utils/formatter';
import EmailService from '../services/EmailService';
import ExceptionMessageTemplates from '../MessageTemplates/ExceptionTemplates';
import * as pdfJS from 'pdfjs-dist/es5/build/pdf';
import emailService from '../services/EmailService';
import UserModel from './user/User';

export const enum AFCRequestStatus {
    REQUEST_INITIATED = 'REQUEST_INITIATED',
    OCR_REQUESTED = 'OCR_REQUESTED',
    OCR_REQUEST_ACCEPTED = 'OCR_REQUEST_ACCEPTED',
    OCR_REQUEST_REJECTED = 'OCR_REQUEST_REJECTED',
    OCR_COMPLETED = 'OCR_COMPLETED',
    OCR_FAILED = 'OCR_FAILED',
    OCR_SKIPPED = 'OCR_SKIPPED',
    FORMATTING_REQUESTED = 'FORMATTING_REQUESTED',
    FORMATTING_COMPLETED = 'FORMATTING_COMPLETED',
    FORMATTING_FAILED = 'FORMATTING_FAILED',
    ESCALATION_REQUESTED = 'ESCALATION_REQUESTED',
    ESCALATION_RESOLVED = 'ESCALATION_RESOLVED',
    RETRY_REQUESTED = 'RETRY_REQUESTED',
}

export class AFCRequestLifecycleEvent {
    status: AFCRequestStatus;
    actionAt: Date;

    constructor(status: AFCRequestStatus, actionedAt: Date = new Date()) {
        this.status = status;
        this.actionAt = actionedAt;
    }
}

export const enum AFCRequestOutputFormat {
    PDF = 'PDF',
    TEXT = 'TXT',
    WORD = 'DOCX',
    MP3 = 'MP3',
    HTML = 'HTML',
}

export enum AFCTriggerer {
    USER = 'user',
    VC_MODEL = 'vc_model',
}
export enum DocType {
    MATH = 'MATH',
    NONMATH = 'NONMATH',
}
export interface AFCRequestProps {
    _id?: string;
    afcRequestId?: string;
    userId: string;
    inputFileId: string;
    outputURL?: string;
    documentName: string;
    pageCount?: number;
    docType: DocType;
    status?: AFCRequestStatus;
    statusLog?: AFCRequestLifecycleEvent[];
    outputFormat: AFCRequestOutputFormat;
    tag?: string;
    escalatedId?: string;
    reviews?: ReviewModel[];
    triggeredBy: AFCTriggerer;
    triggeringCaseId?: string;
    inputFileLink?: string;
    expiryTime?: Date;
}

class AfcModel implements AFCRequestProps {
    static serviceName = 'AfcModel';

    afcRequestId: string = '';
    userId: string = '';
    inputFileId: string = '';
    outputURL?: string;
    documentName: string = '';
    pageCount?: number;
    docType: DocType = DocType.NONMATH;
    status: AFCRequestStatus = AFCRequestStatus.REQUEST_INITIATED;
    statusLog: AFCRequestLifecycleEvent[] = [
        new AFCRequestLifecycleEvent(AFCRequestStatus.REQUEST_INITIATED)
    ];
    outputFormat: AFCRequestOutputFormat;
    tag?: string;
    escalatedId?: string;
    reviews?: ReviewModel[] = [];
    triggeredBy: AFCTriggerer = AFCTriggerer.USER;
    triggeringCaseId?: string;
    inputFileLink?: string;
    expiryTime?: Date;

    constructor(props: AFCRequestProps) {
        this.afcRequestId = props.afcRequestId || props._id || '';
        this.inputFileId = props.inputFileId;
        this.outputFormat = props.outputFormat;
        this.outputURL = props.outputURL;
        this.userId = props.userId;
        this.documentName = props.documentName;
        this.triggeredBy = props.triggeredBy;
        this.triggeringCaseId = props.triggeringCaseId;
        this.status = props.status || AFCRequestStatus.REQUEST_INITIATED;
        this.statusLog = props.statusLog || [];
        this.pageCount = props.pageCount;
        this.docType = props.docType;
        this.tag = props.tag;
        this.escalatedId = props.escalatedId;
        this.reviews = props.reviews;
        this.inputFileLink = props.inputFileLink;
        this.expiryTime = props.expiryTime;
    }

    public static async createAndPersist(props: AFCRequestProps) {
        const logger = loggerFactory(AfcModel.serviceName, 'createAndPersist');
        let request = new AfcModel(props);
        request.statusLog.push(new AFCRequestLifecycleEvent(request.status));
        const result = await new AfcDbModel(request).save();

        logger.info('got afc request id after creation: ' + result._id);
        request.afcRequestId = result._id;

        return request;
    }

    public static async averageResolutionTime(userId: string) {
        const logger = loggerFactory(
            AfcModel.serviceName,
            'averageResolutionTime'
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
        const logger = loggerFactory(AfcModel.serviceName, 'changeStatusTo');
        logger.info(
            `Changing status to: ${newStatus} of request: ${this.afcRequestId}`
        );
        this.status = newStatus;
        const event = new AFCRequestLifecycleEvent(newStatus);
        this.statusLog.push(event);

        await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
            status: newStatus,
            $push: { statusLog: event }
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

    public async updateFormattingResults(outputURL: string, pages: number) {
        this.outputURL = outputURL;
        this.pageCount = pages;
        return await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
            outputURL: outputURL,
            pageCount: pages
        }).lean();
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
        const logger = loggerFactory(AfcModel.serviceName, 'getAfcModelById');
        const afcDbRequest = await AfcDbModel.findById(id).lean();
        logger.info('db object for afc: %o', afcDbRequest as AfcModel);
        if (afcDbRequest !== null) {
            const afcRequest = new AfcModel(afcDbRequest);
            logger.info('retrieved afc model: %o', afcRequest);
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
            status: AFCRequestStatus.ESCALATION_REQUESTED
        }).exec();
    }

    public static async getAllAfcActivityForUser(userId: string) {
        return AfcDbModel.find({ userId: userId }).lean();
    }

    public static async getCompletedAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            status: AFCRequestStatus.FORMATTING_COMPLETED
        }).lean();
    }

    public static async getEscalatedAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            $and: [
                {
                    $or: [
                        { status: AFCRequestStatus.ESCALATION_REQUESTED },
                        { status: AFCRequestStatus.ESCALATION_RESOLVED }
                    ]
                }
            ]
        }).lean();
    }

    public static async getActiveAfcRequestForUser(userId: string) {
        return AfcDbModel.find({
            userId,
            status: { $ne: AFCRequestStatus.FORMATTING_COMPLETED }
        }).lean();
    }

    public static async getAfcRatingCountForUser(userId: string) {
        let rating = 0;
        let count = 0;
        await AfcDbModel.find({ userId: userId })
            .exec()
            .then((afcRequests) => {
                afcRequests.forEach((afc) => {
                    if (afc?.reviews?.length) {
                        count += 1;
                        rating += Number(
                            afc.reviews[afc.reviews.length - 1].rating
                        );
                        console.log(
                            afc.reviews[afc.reviews.length - 1].rating,
                            afc.reviews.length,
                            afc.reviews[1].rating,
                            afc.reviews
                        );
                    }
                });
            });
        return { count, rating };
    }

    public static afcCronHandler(
        expiryTimeGTE: string,
        expiryTimeLTE: string
    ): void {
        const logger = loggerFactory(AfcModel.serviceName, 'afcCronHandler');
        const failedRequests: string[] = [];
        AfcDbModel.find({
            expiryTime: { $gte: new Date(expiryTimeGTE), $lte: new Date(expiryTimeLTE) }
        })
            .exec()
            .then((afc) => {
                const status = [
                    AFCRequestStatus.REQUEST_INITIATED,
                    AFCRequestStatus.OCR_REQUESTED,
                    AFCRequestStatus.OCR_REQUEST_ACCEPTED,
                    AFCRequestStatus.OCR_COMPLETED,
                    AFCRequestStatus.OCR_SKIPPED,
                    AFCRequestStatus.FORMATTING_REQUESTED
                ];
                let pendingStatus = false;

                if (afc) {
                    afc.forEach((afcReq) => {
                        pendingStatus = status.some(
                            (afcStatus) => afcStatus === afcReq?.status
                        );
                        if (pendingStatus) {
                            FileModel.afcInputFileHandler(afcReq);
                            failedRequests.push(getFormattedJson(afcReq));
                        }
                    });
                }

                if (!pendingStatus) {
                    logger.info(
                        `No failed AFC Request found during cron sweep between ${expiryTimeGTE} and ${expiryTimeLTE}`
                    );
                } else {
                    logger.info('notifying I-Stem for failures');
                    EmailService.sendInternalDiagnosticEmail(
                        ExceptionMessageTemplates.getAFCFailureMessage({
                            data: failedRequests
                        })
                    );
                }
            })
            .catch((err) =>
                logger.error(`Error occured in filtering AFC ${err}`)
            );
    }

    public static async setExpiryTime(afcId: string, creationTime: number, pageNumber: number) {
        const expiryTime = new Date(
            creationTime + Math.ceil(pageNumber / 100) * 1000 * 60 * 60
        );
        await AfcDbModel.findByIdAndUpdate(afcId, {expiryTime});
    }

    public static async updateAfcPageCount(
        afcId: string,
        filePath: string
    ): Promise<any> {
        const logger = loggerFactory(
            AfcModel.serviceName,
            'updateAfcPageCount'
        );
        let pageCount = 0;
        let creationTime = 0;
        logger.info(`AFC REQUEST ID: ${afcId}`);
        const extension = filePath.split('.').pop()?.toUpperCase();
        logger.info(`EXTENSION FOR FILE: ${extension}`);
        if (extension === AFCRequestOutputFormat.PDF) {
            logger.info('url: ', filePath);
            pdfJS.getDocument({ url: filePath }).promise.then(
                async function (doc) {
                    const numPages = doc.numPages;
                    logger.info('# Document Loaded');
                    logger.info('Number of Pages: ' + numPages);
                    const afc = await AfcDbModel.findByIdAndUpdate(
                        afcId,
                        {
                            pageCount: numPages
                        },
                        { new: true }
                    ).lean();
                    pageCount = afc?.pageCount || 0;
                    creationTime = new Date((afc as unknown as any).createdAt).getTime();
                    await AfcModel.setExpiryTime(afc?._id, creationTime, pageCount);
                },
                function (err) {
                    logger.error('Error', err);
                }
            );
        } else {
            const afc = await AfcDbModel.findByIdAndUpdate(
                afcId,
                {
                    pageCount: 1
                },
                { new: true }
            ).lean();
            pageCount = afc?.pageCount || 0;
        }
        return pageCount;
    }

    public static sendAfcFailureMessageToUser(user: UserModel, afcRequest: AfcModel){
        emailService.sendEmailToUser(
            user,
            ExceptionMessageTemplates.getFailureMessageForUser(
                {
                    user,
                    data: afcRequest
                }
            )
        );
    }

    public static async updateAfcPageCount(
        afcId: string,
        filePath: string
    ): Promise<any> {
        const logger = loggerFactory(
            AfcModel.serviceName,
            'updateAfcPageCount'
        );
        let pageCount = 0;
        let creationTime = 0;
        logger.info(`AFC REQUEST ID: ${afcId}`);
        const extension = filePath.split('.').pop()?.toUpperCase();
        logger.info(`EXTENSION FOR FILE: ${extension}`);
        if (extension === AFCRequestOutputFormat.PDF) {
            logger.info('url: ', filePath);
            pdfJS.getDocument({ url: filePath }).promise.then(
                async function (doc) {
                    const numPages = doc.numPages;
                    logger.info('# Document Loaded');
                    logger.info('Number of Pages: ' + numPages);
                    const afc = await AfcDbModel.findByIdAndUpdate(
                        afcId,
                        {
                            pageCount: numPages
                        },
                        { new: true }
                    ).lean();
                    pageCount = afc?.pageCount || 0;
                    creationTime = new Date((afc as unknown as any).createdAt).getTime();
                    await AfcModel.setExpiryTime(afc?._id, creationTime, pageCount);
                },
                function (err) {
                    logger.error('Error', err);
                }
            );
        } else {
            const afc = await AfcDbModel.findByIdAndUpdate(
                afcId,
                {
                    pageCount: 1
                },
                { new: true }
            ).lean();
            pageCount = afc?.pageCount || 0;
        }
        return pageCount;
    }

    public static async setExpiryTime(afcId: string, creationTime: number, pageNumber: number) {
        const expiryTime = new Date(
            creationTime + Math.ceil(pageNumber / 100) * 1000 * 60 * 60
        );
        await AfcDbModel.findByIdAndUpdate(afcId, {expiryTime});
    }

    public static async updateAfcPageCount(
        afcId: string,
        filePath: string
    ): Promise<any> {
        const logger = loggerFactory(
            AfcModel.serviceName,
            'updateAfcPageCount'
        );
        let pageCount = 0;
        let creationTime = 0;
        logger.info(`AFC REQUEST ID: ${afcId}`);
        const extension = filePath.split('.').pop()?.toUpperCase();
        logger.info(`EXTENSION FOR FILE: ${extension}`);
        if (extension === AFCRequestOutputFormat.PDF) {
            logger.info('url: ', filePath);
            pdfJS.getDocument({ url: filePath }).promise.then(
                async function (doc) {
                    const numPages = doc.numPages;
                    logger.info('# Document Loaded');
                    logger.info('Number of Pages: ' + numPages);
                    const afc = await AfcDbModel.findByIdAndUpdate(
                        afcId,
                        {
                            pageCount: numPages
                        },
                        { new: true }
                    ).lean();
                    pageCount = afc?.pageCount || 0;
                    creationTime = new Date((afc as unknown as any).createdAt).getTime();
                    await AfcModel.setExpiryTime(afc?._id, creationTime, pageCount);
                },
                function (err) {
                    logger.error('Error', err);
                }
            );
        } else {
            const afc = await AfcDbModel.findByIdAndUpdate(
                afcId,
                {
                    pageCount: 1
                },
                { new: true }
            ).lean();
            pageCount = afc?.pageCount || 0;
        }
        return pageCount;
    }

}

export default AfcModel;
