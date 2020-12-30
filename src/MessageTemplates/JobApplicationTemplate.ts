import UserModel from '../domain/user/User';
import ReviewModel from '../domain/ReviewModel';
import MessageModel, { MessageLabel } from '../domain/MessageModel';
import { getFormattedJson } from '../utils/formatter';

export enum JobApplicationTemplateNames {
JOB_APPLICATION = 'JOB_APPLICATION',
JOB_APPLICATION_ACCEPTANCE = "JOB_APPLICATION_ACCEPTANCE"
}

export interface JobApplicationMessageTemplateProps {
user: UserModel | null;
formData: String;
}

class JobApplicationTemplate {
    public static getJobApplicationMessage(props: JobApplicationMessageTemplateProps): MessageModel {
return new MessageModel({
    isInternal: true,
    subject: `Hey! you have recieved a job application from ${props.user?.fullname}`,
    label: MessageLabel.JOB_APPLICATION,
    templateId: JobApplicationTemplateNames.JOB_APPLICATION,
    body:
    `<p>Hello I-Stem!</p>
    <p> You have one more job application:</p>
    <ul>
    <li> user name: ${props.user?.fullname}</li>
    <li>email: ${props.user?.email}</li>
    </ul>
    <pre>formdata: ${props.formData}</pre>
    `
});
    }

    public static getJobApplicationReceiptMessage(props: JobApplicationMessageTemplateProps): MessageModel {
        return new MessageModel({
            isInternal: false,
            receiverEmail: props.user?.email,
            receiverId: props.user?.userId,
            subject: `[I-Stem] Thanks for applying for job opportunities with our corporate partners`,
            label: MessageLabel.JOB_APPLICATION,
            templateId: JobApplicationTemplateNames.JOB_APPLICATION_ACCEPTANCE,
            body:
            `<p>Hello ${props.user?.fullname}</p>
            <p> We just wanted to let you know that we have received job application from you. We will be forwarding the uploaded resume along with other information to our corporate partners. You will soon get communication from the corporate if there is a skills match.</p>
<p>If you have any query, you could always email us at info@inclusivestem.org.</p>
<p>Team I-Stem</p>
            `
        });
            }
        

}

export default JobApplicationTemplate;
