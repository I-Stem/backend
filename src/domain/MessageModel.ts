import loggerFactory from '../middlewares/WinstonLogger';
import {TemplateName} from '../MessageTemplates/TemplateNames';
import MessageDbModel from '../models/Message';

export const enum MessageLabel {
    INVITATION = 'INVITATION',
    MARKETING = 'MARKETING',
    API_FAILURE_ALERT = 'API_FAILURE_ALERT',
    FEEDBACK_FOR_ISTEM = 'FEEDBACK_FOR_ISTEM',
    REQUEST_STATUS_UPDATE = 'REQUEST_STATUS_UPDATE',
    ESCALATION = 'ESCALATION',
    AUTHENTICATION = 'AUTHENTICATION',
    REQUEST_SERVICE_UPGRADE = 'REQUEST_SERVICE_UPGRADE',
    JOB_APPLICATION = 'JOB_APPLICATION',
    MENTORSHIP = 'MENTORSHIP',
    AFC_FAILURE = 'AFC_FAILURE',
<<<<<<< HEAD
    ISTEM_ADMIN_FLOW = "ISTEM_ADMIN_FLOW"
=======
>>>>>>> a3f6820... google oauth changes
}

export const enum MessageStatus {
    INITIATED = 'INITIATED',
    SENT = 'SENT',
    READ = 'READ'
}

export class MessageLifecycleEvent {
    status: MessageStatus = MessageStatus.INITIATED;
    actionedAt: Date;

    constructor(status: MessageStatus, actionedAt: Date= new Date()) {
this.status = status;
this.actionedAt = actionedAt;
    }
}

export interface IMessage  {
    messageId?: string;
    _id?: string;
    triggeredBy?: string;
    receiverId?: string;
    receiverEmail?: string;
    body: string;
    subject: string;
    text?: string;
    link?: string;
    label: MessageLabel;
    status?: MessageStatus;
    statusLog?: MessageLifecycleEvent[];
    templateId: TemplateName;
    isInternal: boolean;
}

class MessageModel {

    static ServiceName = 'MessageModel';

    messageId?: string;
        triggeredBy?: string;
    receiverId?: string;
    receiverEmail?: string;
    body: String;
    subject: String;
    text: String = '';
    link?: String;
    label: MessageLabel;
    status: MessageStatus;
    statusLog: MessageLifecycleEvent[];
    templateId: TemplateName;

    // internal email are emails sent to I-Stem developers or other team members for diagnostic purposes
    // internal emails need not persist to database
    isInternal: boolean = false;

    constructor(message: IMessage) {
        const logger = loggerFactory(MessageModel.ServiceName, 'constructor');
        logger.info('template id: ' + message.templateId);
        this.messageId = message.messageId || message._id || '';
        this.subject = message.subject;
        this.body = message.body;
        this.templateId = message.templateId;
        this.label = message.label;
        this.status = message.status || MessageStatus.INITIATED;
        this.statusLog = [{status: MessageStatus.INITIATED, actionedAt: new Date()}];
        this.isInternal = message.isInternal;
        this.statusLog = message.statusLog || [];
        this.text = message.text || '';
        this.receiverId = message.receiverId || '';
        this.receiverEmail = message.receiverEmail || '';
        this.triggeredBy = message.triggeredBy;
    }

    public async persist() {
        const message = await new MessageDbModel(this).save();
        this.messageId = message._id;
        return this;
    }

    public async changeStatusTo(status: MessageStatus) {
        this.status = status;
        const event = new MessageLifecycleEvent(status);
        this.statusLog.push(event);

        if (this.isInternal === false) {
        await MessageDbModel.findByIdAndUpdate(this.messageId, {status: status,
        $push: {statusLog: event}});
        }

        return this;
            }
}

export default MessageModel;
