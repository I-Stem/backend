import UserModel from '../domain/User';
import ReviewModel from '../domain/ReviewModel';
import MessageModel, { MessageLabel } from '../domain/MessageModel';
import { getFormattedJson } from '../utils/formatter';

export enum MentorshipTemplateName {
    MENTORSHIP = 'mentorship',
MENTORSHIP_RECEIPT = 'MENTORSHIP_RECEIPT'
}

export interface MentorshipMessageTemplateProps {
user: UserModel | null;
formData: String;
}

export interface MentorshipApplicationAcknowledgementMessageTemplateProps {
    user:UserModel;
    subject:string;
    bodyBlock:string;
}

class MentorshipTemplate {
    public static getMentorshipMessage(props: MentorshipMessageTemplateProps): MessageModel {
return new MessageModel({
    isInternal: true,
    subject: `Hey! you have recieved a mentorship application from ${props.user?.fullname}`,
    label: MessageLabel.MENTORSHIP,
    templateId: MentorshipTemplateName.MENTORSHIP,
    body:
    `<p>Hello I-Stem!</p>
    <p> You have one more mentorship application:</p>
    <ul>
    <li> user name: ${props.user?.fullname}</li>
    <li>email: ${props.user?.email}</li>
    </ul>
    <p>formdata: <pre>${props.formData}</pre></p>
    `
});
    }

        public static getMentorshipApplicationReceivedAcknowledgementMessage(props: MentorshipApplicationAcknowledgementMessageTemplateProps): MessageModel {
    return new MessageModel({
        isInternal: false,
        subject: props.subject,
        label: MessageLabel.MENTORSHIP,
        templateId: MentorshipTemplateName.MENTORSHIP_RECEIPT,
        body:
        `<p>Hello ${props.user.fullname}!</p>
        <p>${props.bodyBlock}</p>
        <p>Team I-Stem</p>
        `
    });
        }
    }

export default MentorshipTemplate;
