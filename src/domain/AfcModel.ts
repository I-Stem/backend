import { plainToClass } from 'class-transformer';
import AfcDbModel from '../models/AFC';
import ReviewModel from './ReviewModel';
import loggerFactory from '../middlewares/WinstonLogger';
import FileModel from './FileModel';
import { getFormattedJson } from '../utils/formatter';
import EmailService from "../services/EmailService";
import ExceptionMessageTemplates from "../MessageTemplates/ExceptionTemplates";


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
    ESCALATION_RESOLVED = 'ESCALATION_RESOLVED'
}

export class AFCRequestLifecycleEvent {
status: AFCRequestStatus;
actionAt: Date;

constructor(status: AFCRequestStatus, actionedAt: Date = new Date()) {
    this.status = status;
    this.actionAt = actionedAt;
}
}

export enum AFCRequestOutputFormat {
    PDF="PDF",
    TEXT = "TXT",
    WORD="DOCX",
    MP3 = "MP3",
    HTML="HTML"
}

export enum AFCTriggerer {
USER = 'user',
VC_MODEL = 'vc_model'
}
export enum DocType {
    MATH = "MATH",
    NONMATH = "NONMATH"
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
    statusLog: AFCRequestLifecycleEvent[] = [new AFCRequestLifecycleEvent(AFCRequestStatus.REQUEST_INITIATED)];
    outputFormat: AFCRequestOutputFormat;
    tag?: string;
    escalatedId?: string;
    reviews?: ReviewModel[] = [];
triggeredBy: AFCTriggerer = AFCTriggerer.USER;
triggeringCaseId?: string;

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
}

public static async createAndPersist(props: AFCRequestProps) {
    const logger = loggerFactory(AfcModel.serviceName, 'createAndPersist');
    let request = new AfcModel(props);
    request.statusLog.push(new AFCRequestLifecycleEvent(request.status));
    const result = await new AfcDbModel(request)
.save();

    logger.info('got afc request id after creation: ' + result._id);
    request.afcRequestId = result._id;

    return request;
}

public async changeStatusTo(newStatus: AFCRequestStatus) {
    const logger = loggerFactory(AfcModel.serviceName, 'changeStatusTo');
    logger.info(`Changing status to: ${newStatus} of request: ${this.afcRequestId}`);
    this.status = newStatus;
    const event = new AFCRequestLifecycleEvent(newStatus);
    this.statusLog.push(event);

    await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {status: newStatus,
$push: {statusLog: event}});

    return this;
}

public async updateTriggeringCaseId(triggererId: string) {
    this.triggeringCaseId = triggererId;
    return AfcDbModel.findByIdAndUpdate(this.afcRequestId, {triggeringCaseId: triggererId}, {new: true}).lean();
}

public async updateFormattingResults(outputURL: string, pages: number) {
    this.outputURL = outputURL;
    this.pageCount = pages;
    return await AfcDbModel.findByIdAndUpdate(this.afcRequestId, {
            outputURL: outputURL,
        pageCount: pages
    }).lean();
}
public static async saveReview(afcRequestId: string, review: ReviewModel): Promise<AfcModel | null> {
return AfcDbModel.findOneAndUpdate(
    {_id: afcRequestId},
    {$push: {reviews:  review },
review: review},
    {new: true}
    )
    .lean();
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

    public static async getAfcRequestCountForUser(userId: string): Promise<number> {
return AfcDbModel.countDocuments({userId: userId}).exec();
    }

    public static afcCronHandler(createdAtHourGTE: string, createdAtHourLTE: string): void{
        const logger = loggerFactory(AfcModel.serviceName, 'afcCronHandler');
        const failedRequests:string[] = [];
        AfcDbModel.find({ createdAt: { $gte: createdAtHourGTE, $lte: createdAtHourLTE } })
                    .exec()
                    .then((afc) => {
                        const status = [
                            AFCRequestStatus.REQUEST_INITIATED,
                            AFCRequestStatus.OCR_REQUESTED,
                            AFCRequestStatus.OCR_REQUEST_ACCEPTED,
                            AFCRequestStatus.OCR_COMPLETED,
                            AFCRequestStatus.OCR_SKIPPED,
                            AFCRequestStatus.FORMATTING_REQUESTED,
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

                            if(!pendingStatus)
                            logger.info(`No failed AFC Request found during cron sweep between ${createdAtHourGTE} and ${createdAtHourLTE}`);
                            else {
                                logger.info("notifying I-Stem for failures");
                                EmailService.sendInternalDiagnosticEmail(ExceptionMessageTemplates.getAFCFailureMessage({data: failedRequests}));                                
                            }

                    })
                    .catch((err) =>
                        logger.error(`Error occured in filtering AFC ${err}`)
                    );
    }
}

export default AfcModel;
