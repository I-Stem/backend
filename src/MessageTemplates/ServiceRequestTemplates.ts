import MessageModel, { MessageLabel } from "../domain/MessageModel";
import MLModelModel from "../domain/MLModelModel";
import UserModel from "../domain/user/User";

export enum ServiceRequestStatusTemplateNames {
    CUSTOM_MODEL_TRAINING_COMPLETE = "custom_model_training_complete",
    SERVICE_REQUEST_COMPLETE = "SERVICE_REQUEST_COMPLETE",
    ACCESS_REQUEST_COMPLETE = "ACCESS_REQUEST_COMPLETE",
    AUTO_DOMAIN_ACCESS = "AUTO_DOMAIN_ACCESS",
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

interface DomainAccessRequestProps extends UserData {
    domainName: string;
    universityName: string;
}
class ServiceRequestTemplates {
    public static getModelTrainingCompleteMessage(
        props: ModelTrainingCompleteMessageProps
    ): MessageModel {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.REQUEST_STATUS_UPDATE,
            templateId:
                ServiceRequestStatusTemplateNames.CUSTOM_MODEL_TRAINING_COMPLETE,
            subject: `Hurray! Your custom language model ${props.modelName} trained successfully. | I-Stem`,
            body: `<p>Hello ${props.userName}</p>
                    <p>Your custom language model ${props.modelName} has been successfully trained with the data you provided. Please login to I-Stem Portal to upload the audio/video file for audio-video content accessibility.</p>
                    <p>I-Stem</p>
                    `,
        });
    }

    public static getServiceRequestComplete(
        props: ServiceRequestCompleteMessageProps
    ): MessageModel {
        return new MessageModel({
            isInternal: false,
            templateId:
                ServiceRequestStatusTemplateNames.SERVICE_REQUEST_COMPLETE,
            label: MessageLabel.REQUEST_STATUS_UPDATE,
            subject: `[I-Stem] Service request for ${props.documentName} is complete!!`,
            body: `<p>Hello ${props.userName}</p>
            <p>Your service request for file ${props.documentName} is complete. Please click <a href="${props.outputURL}">here</a> to download the output file.</p>

            <p>I-Stem</p>
            `,
        });
    }

    public static getAccessRequestComplete(props: UserData): MessageModel {
        return new MessageModel({
            isInternal: false,
            templateId:
                ServiceRequestStatusTemplateNames.ACCESS_REQUEST_COMPLETE,
            label: MessageLabel.REQUEST_SERVICE_UPGRADE,
            subject: `Access granted to AI Services`,
            receiverId: props.userId,
            body: `<p>Hello ${props.userName},</p>
            <p>Welcome aboard to I-Stem AI services!!</p>
            <p>Your request for access to AI Services has been approved by I-Stem.</p>
            <p>Thanks a lot for onboarding with I-Stem. Our team is working hard to provide you the most accurate and state-of-art technology for the AI accommodation services, but right now, our system is in beta phase and therefore some hickups are expected, we are constantly learning from our mistakes and building it to serve you better. We are really hopeful that you will support us in this journey and together we will build a system which will be good for everyone.</p>
            <p> You could email us anytime at info@inclusivestem.org, if you have any suggestion or issues while accessing services or you could also provide your feedback on each request or for each service from the portal as well.</p>
            <p>Please logout and log In again to your account on I-Stem portal to access the services.</p>
            <p>I-Stem</p>
            `,
        });
    }

    public static getDomainAccessRequest(
        props: DomainAccessRequestProps
    ): MessageModel {
        return new MessageModel({
            isInternal: true,
            templateId: ServiceRequestStatusTemplateNames.AUTO_DOMAIN_ACCESS,
            label: MessageLabel.ISTEM_ADMIN_FLOW,
            subject: `You have one more request for domain access`,
            body: `<p>Hi, ${props.universityName} has requested for auto domain access for domain: ${props.domainName}.</p>
            <p>Name of staff: ${props.userName}</p>
            <p>Visit I-Stem Admin Panel to approve or reject the request. </p>
            `,
        });
    }
}

export default ServiceRequestTemplates;
