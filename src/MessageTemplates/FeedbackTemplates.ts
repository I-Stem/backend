import UserModel from '../domain/user/User';
import ReviewModel from '../domain/ReviewModel';
import {MessageModel} from '../domain/MessageModel';
import { MessageLabel } from '../domain/MessageModel/MessageConstants';
import { getFormattedJson } from '../utils/formatter';
import {FeedbackCategory} from '../domain/FeedbackModel';
export enum FeedbackTemplateNames {
SERVICE_REQUEST_REVIEW = 'service_request_review',
SERVICE_ESCALATION = 'service_escalation',
SERVICE_FEEDBACK = 'SERVICE_FEEDBACK'
}

export interface ReviewMessageTemplateProps {
user: UserModel | null;
reviews: ReviewModel[];
inputURL?: string;
outputURL?: string;
forService: string;
}

export interface FeedbackMessages {
    purpose: string;
    likings: string;
    dislikings: string;
    creditsRequested: number;
    rating: number;
}

export interface FeedbackMessageTemplateProps {
    user: UserModel | null;
    message: FeedbackMessages;
    feedbackFor: FeedbackCategory;
}

class FeedbackTemplates {
    public static getReviewMessage(props: ReviewMessageTemplateProps): MessageModel {
return new MessageModel({
    isInternal: true,
    subject: `Hey! you got review from ${props.user?.fullname}`,
    label: MessageLabel.FEEDBACK_FOR_ISTEM,
    templateId: FeedbackTemplateNames.SERVICE_REQUEST_REVIEW,
    body:
    `<p>Hello I-Stem!</p>
    <p> You have one more review on I-Stem service request:</p>
    <ul>
    <li>For service: ${props.forService}</li>
    <li>reviews by user: ${getFormattedJson(props.reviews)}</li>
    <li> user name: ${props.user?.fullname}</li>
    <li>email: ${props.user?.email}</li>
    <li>Input file URL: ${props.inputURL}</li>
    <li>output url: ${props.outputURL}</li>
    </ul>
    `
});
    }

    public static getFeedbackMessageTemplate(props: FeedbackMessageTemplateProps): MessageModel {
        return new MessageModel({
            isInternal: true,
            subject: `Hey! you got feedback from ${props.user?.fullname}`,
            label: MessageLabel.FEEDBACK_FOR_ISTEM,
            templateId: FeedbackTemplateNames.SERVICE_FEEDBACK,
            body: `<p>Hello, I-Stem </p>
             <p>Here is the feedback for: ${props.feedbackFor}</p>

             <p>User email: ${props.user?.email}</p>
             <ul>
             <li>Purpose:</h3><p>${props.message.purpose}</li>
             <li>Likings:</h3><p>${props.message.likings}</li>
             <li>Dislikings:</h3><p>${props.message.dislikings}</li>
             <li>Credits Requested:</h3><p>${props.message.creditsRequested}</li>
             <li>Rating:</h3><p>${props.message.rating}</li>
</ul>
             `
        });
    }

}

export default FeedbackTemplates;
