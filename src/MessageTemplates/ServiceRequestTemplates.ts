import MessageModel, { MessageLabel } from '../domain/MessageModel';
import MLModelModel from '../domain/MLModelModel';
import UserModel from '../domain/User';

export enum ServiceRequestStatusTemplateNames {
    CUSTOM_MODEL_TRAINING_COMPLETE = 'custom_model_training_complete',
    SERVICE_REQUEST_COMPLETE = 'SERVICE_REQUEST_COMPLETE',
    ACCESS_REQUEST_COMPLETE = 'ACCESS_REQUEST_COMPLETE'
}

export interface UserData {
userId?: string;
userEmail?: string;
userName: string;
}

export interface ServiceRequestCompleteMessageProps extends UserData {
    documentName: string;
    outputURL: string;
}

export interface ModelTrainingCompleteMessageProps extends UserData {
    modelName: string;
    }

class ServiceRequestTemplates {
    public static getModelTrainingCompleteMessage(props: ModelTrainingCompleteMessageProps): MessageModel {
                return new MessageModel({
    isInternal: false,
    label: MessageLabel.REQUEST_STATUS_UPDATE,
templateId: ServiceRequestStatusTemplateNames.CUSTOM_MODEL_TRAINING_COMPLETE,
subject: `Hurray! Your custom language model ${props.modelName} trained successfully. | I-Stem`,
body:
`<p>Hello ${props.userName}</p>
<p>Your custom language model ${props.modelName} has been successfully trained with the data you provided. Please login to I-Stem Portal to upload the audio/video file for audio-video content accessibility.</p>

<p>I-Stem</p>
`
});
    }

    public static getServiceRequestComplete(props: ServiceRequestCompleteMessageProps): MessageModel {
        return new MessageModel({
            isInternal: false,
            templateId: ServiceRequestStatusTemplateNames.SERVICE_REQUEST_COMPLETE,
            label: MessageLabel.REQUEST_STATUS_UPDATE,
            subject: `[I-Stem] Service request for ${props.documentName} is complete!!`,
            body:
            `<p>Hello ${props.userName}</p>
            <p>Your service request for file ${props.documentName} is complete. please click <a href="${props.outputURL}">here</a> to download the output file.</p>

            <p>I-Stem</p>
            `
        });
    }

    public static getAccessRequestComplete(props: UserData): MessageModel {
        return new MessageModel({
            isInternal: false,
            templateId: ServiceRequestStatusTemplateNames.ACCESS_REQUEST_COMPLETE,
            label: MessageLabel.REQUEST_SERVICE_UPGRADE,
            subject: `Access granted to AI Services`,
            receiverId: props.userId,
            body:
            `<p>Hello ${props.userName},</p>
            <p>Your request for access to AI Services has been approved by I-Stem.</p>
            <p>Log In again to your account to access the services.</p>
            <p>I-Stem</p>
            `
        });
    }
}

export default ServiceRequestTemplates;
