import MessageModel, { MessageLabel } from '../domain/MessageModel';
import UserModel from '../domain/User';

export const enum AuthMessageTemplateNames {
ACCOUNT_EMAIL_VERIFICATION = 'ACCOUNT_EMAIL_VERIFICATION',
FORGOT_PASSWORD = 'FORGOT_PASSWORD',
REQUEST_SERVICE_UPGRADE = 'REQUEST_SERVICE_UPGRADE'
}

export interface UserDetails {
    name: string;
    email?: string;
}

export interface VerificationMessageProps extends UserDetails {
    verificationLink: string;
}

export interface ServiceUpgradeTemplateProps {
    user: UserModel;
    link?: string;
}

class AuthMessageTemplates {
    static serviceName = 'AuthTemplates';

    public static getAccountEmailVerificationMessage(props: VerificationMessageProps) {
return new MessageModel({
    isInternal: false,
    templateId: AuthMessageTemplateNames.ACCOUNT_EMAIL_VERIFICATION,
    label: MessageLabel.AUTHENTICATION,
    subject: `[I-Stem] Please verify your email to access I-Stem portal`,
    body:
    `<p>Welcome Aboard!!!</p>
    <p>Hi ${props.name}</p>
    <p>Thanks for creating account with I-Stem. Please click on the following link to verify your email id.</p> <a href="${props.verificationLink}">Verify your email</a>
    <p>I-Stem</p>`
});
    }

public static getForgotPasswordMessage(props: VerificationMessageProps) {
    return new MessageModel({
        isInternal: false,
        templateId: AuthMessageTemplateNames.FORGOT_PASSWORD,
        label: MessageLabel.AUTHENTICATION,
        subject: `[I-Stem] Your reset password link`,
         body:
         `<p>Hello ${props.name}</p>
         <p>We have received a request to reset the password for this account. Please click <a href="${props.verificationLink}">here</a> to reset your password.</p>
         <p>I-Stem</p>`
    });
}
    public static getServiceUpgradeMessage(props: ServiceUpgradeTemplateProps): MessageModel {
        return new MessageModel({
            isInternal: true,
            subject: `Hey! you got service upgrade request from ${props.user?.fullname}`,
            label: MessageLabel.REQUEST_SERVICE_UPGRADE,
            templateId: AuthMessageTemplateNames.REQUEST_SERVICE_UPGRADE,
            body:
            `<p>Hello I-Stem!</p>
            <p>You have one more I-Stem service upgradation request:</p>
            <ul>
            <li>Full Name: ${props.user?.fullname}</li>
            <li>Email: ${props.user?.email}</li>
            <li>Current Role: ${props.user.role}</li>
            </ul>
            <p>Click on the <a href=${props.link}>Link</a> to upgrade service. </p>
            `
        });
    }
}

export default AuthMessageTemplates;
