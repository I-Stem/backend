import loggerFactory from '../middlewares/WinstonLogger';
import MessageModel, { MessageLabel } from '../domain/MessageModel';
import UserModel from 'src/domain/user/User';
import AfcModel from 'src/domain/AfcModel';
import { getFormattedJson } from '../utils/formatter';

export enum ExceptionTemplateNames {
API_EXCEPTION = 'api_exception',
VIDEO_INDEXING_API_FAILED = 'VIDEO_INDEXING_API_FAILED',
AFC_FAILURE = 'AFC_FAILURE',
VC_FAILURE = 'VC_FAILURE'
}

export interface ExceptionTemplateProps {
code: number;
correlationId?: string;
reason: string;
stackTrace?: string;
userId?: string;
}

export interface OCRExceptionTemplateProps extends ExceptionTemplateProps {
    inputURL?: string;
    requests?: string[];
}

export interface CustomSpeechTrainingFailingMessageProps extends ExceptionTemplateProps {
    afcRequestId: string;
    modelName?: string;
    dataFileId: string;
outputURL: string;
}

export interface FormattingAPIFailingMessageProps extends ExceptionTemplateProps {
    inputURL: string;
    inputFileId: string;
    afcRequestId: string;
    OCRVersion: string;
    }

export interface VideoInsightFailingMessageProps extends ExceptionTemplateProps {
requestType: string;
vcRequestId?: string;
modelId?: string;
documentName: string;
inputURL?: string;
inputFileId: string;
    }

export interface FailureMessageForUserProps extends Partial<ExceptionTemplateProps> {
        user: UserModel;
        data: AfcModel;
}

export interface AFCFailureMessageProps{
    data: any[];
    timeInterval: string[];
}

export interface VCFailureMessageProps{
    data: any[];
    timeInterval: string[];
}

export interface AFCFailureMessageForUserProps{
    documentName: string;
    user: string;
}

class ExceptionMessageTemplates {
    static ServiceName = 'ExceptionMessageTemplates';

    public static getExceptionMessage(props: ExceptionTemplateProps): MessageModel {
        const logger = loggerFactory(ExceptionMessageTemplates.ServiceName, 'getExceptionMessage');
        // logger.info("template names: %o", TemplateName);
        return new MessageModel({
            isInternal: true,
             subject: `Oops! error: ${props.reason}`,
body :
`<p>Hello I-Stem</p>
   <p> We have encountered an error. Here are the details of error: </p>
<ul>
<li>code: ${props.code} </li>
<li>reason: ${props.reason}</li>
<li>Correlation id: ${props.correlationId}</li>
<li>stacktrace: ${props.stackTrace}</li>
</ul>
`,
templateId:     ExceptionTemplateNames.API_EXCEPTION,
label: MessageLabel.API_FAILURE_ALERT
        });
    }

    public static getOCRExceptionMessage(props: OCRExceptionTemplateProps): MessageModel {
        const logger = loggerFactory(ExceptionMessageTemplates.ServiceName, 'getOCRExceptionMessage');
        // logger.info("template names: %o", TemplateName);
        return new MessageModel({
            isInternal: true,
             subject: `Oops! error: OCR API failing`,
body :
`<p>Hello I-Stem</p>
   <p> We have encountered an error. Here are the details of error: </p>
<ul>
<li>code: ${props.code} </li>
<li>reason: ${props.reason}</li>
<li>Correlation id: ${props.correlationId}</li>
<li>input file URL: ${props.inputURL}</li>
<li>stacktrace: ${props.stackTrace}</li>
</ul>
`,
templateId:     ExceptionTemplateNames.API_EXCEPTION,
label: MessageLabel.API_FAILURE_ALERT
        });
    }

    public static getCustomSpeechTrainingFailingMessage(props: CustomSpeechTrainingFailingMessageProps) {
return new MessageModel({
    isInternal: true,
    subject: `Oops!! error: ${props.reason}`,
    body:
    `<p>Hello I-Stem</p>
    <p>We have encountered the error in custom speech training:</p>
    <ul>
    <li>code: ${props.code} </li>
    <li>reason: ${props.reason}</li>
    <li>Correlation id: ${props.correlationId}</li>
    <li>stacktrace: ${props.stackTrace}</li>
    <li>triggered for userId: ${props.userId}</li>
    <li>modelName: ${props.modelName}</li>
    <li>dataFileId: ${props.dataFileId}</li>
        <li>afcRequestId: ${props.afcRequestId}</li>
        <li>afc converted file url: ${props.outputURL}</li>
    </ul>
    `,
    label: MessageLabel.API_FAILURE_ALERT,
    templateId: ExceptionTemplateNames.API_EXCEPTION
});
    }

public static getFormattingAPIFailingExceptionMessage(props: FormattingAPIFailingMessageProps) {
return new MessageModel({
    isInternal: true,
    label: MessageLabel.API_FAILURE_ALERT,
    templateId: ExceptionTemplateNames.API_EXCEPTION,
    subject: `Oops!! error, ${props.reason}`,
    body:
    `<p>Hello I-Stem</p>
    <p> we have encountered an error:</p>
    <ul>
    <li>code: ${props.code} </li>
    <li>reason: ${props.reason}</li>
    <li>Correlation id: ${props.correlationId}</li>
    <li>stacktrace: ${props.stackTrace}</li>
    <li>triggered for userId: ${props.userId}</li>
    <li>input file Id: ${props.inputFileId}</li>
        <li>afcRequestId: ${props.afcRequestId}</li>
<li>input file URL: ${props.inputURL}</li>
    </ul>
    `
});
}

public static getVideoInsightAPIFailureMessage(props: VideoInsightFailingMessageProps) {
    return new MessageModel({
        isInternal: true,
        label: MessageLabel.API_FAILURE_ALERT,
        templateId: ExceptionTemplateNames.VIDEO_INDEXING_API_FAILED,
    subject: `oops! video insight error: ${props.reason}`,
    body:
    `<p>Hello I-Stem</p>
    <p>We have encountered an error:</p>
    <ul>
    <li>code: ${props.code} </li>
    <li>reason: ${props.reason}</li>
    <li>Correlation id: ${props.correlationId}</li>
    <li>stacktrace: ${props.stackTrace}</li>
    <li>VCRequestId: ${props.vcRequestId}</li>
    <li>request type: ${props.requestType}</li>
    <li>input file Id: ${props.inputFileId}</li>
<li>input file URL: ${props.inputURL}</li>
    <li>modelId: ${props.modelId}</li>
    </ul>`
    });
    }

    public static getFailureMessageForUser(props: FailureMessageForUserProps): MessageModel {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.API_FAILURE_ALERT,
            templateId: ExceptionTemplateNames.API_EXCEPTION,
            subject: `[I-Stem] Service request for ${props.data.documentName} failed!!`,
            body: `
                <p>Hello, ${props.user.fullname} </p>
                <p>We were unable to process your request for file: ${props.data.documentName}. We are currently facing technical issues. </p>
                <p>Please try again in some time </p>
                <p>Thanks<p>
                <p>I-Stem</p>
            `
        });
    }

    public static getAFCFailureMessage(props: AFCFailureMessageProps): MessageModel {
        return new MessageModel({
            isInternal: true,
            label: MessageLabel.AFC_FAILURE,
            templateId: ExceptionTemplateNames.AFC_FAILURE,
            subject: `Oops! AFC Failure detected during cron!`,
            body: `<p>Here are the detailed informations:</p>
            <p>Time Interval for cron job: ${props.timeInterval[0]} ${props.timeInterval[1]}</p>
            <pre>${getFormattedJson(props.data)}</pre>`
        })
    }

    public static getVCFailureMessage(props: VCFailureMessageProps): MessageModel {
        return new MessageModel({
            isInternal: true,
            label: MessageLabel.VC_FAILURE,
            templateId: ExceptionTemplateNames.VC_FAILURE,
            subject: `Oops! VC Failure detected during cron!`,
            body: `<p>Here are the detailed informations:</p>
            <p>Time Interval for cron job: ${props.timeInterval[0]} ${props.timeInterval[1]}</p>
            <pre>${getFormattedJson(props.data)}</pre>`
        })
    }
    
    public static getAFCFailureMessageForUser(props: AFCFailureMessageForUserProps): MessageModel {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.AFC_FAILURE,
            templateId: ExceptionTemplateNames.AFC_FAILURE,
            subject: ` [I-Stem] Document accessibility request for document ${props.documentName} failed`,
            body: `<p>Hello ${props.user}</p>
                   <p>The document accessibility conversion request for the document ${props.documentName} has failed.
                   Please retry after some time. We are extremely sorry for inconvenience caused, rest assured, our developers are currently looking into the issue which triggered the failure.</p>
                   <p>Team I-Stem</p>`
        })
    }
}

export default ExceptionMessageTemplates;
