import { getFormattedJson } from "../utils/formatter";
import { InvitedUser } from "../domain/InvitedUserModel";
import MessageModel, { MessageLabel } from "../domain/MessageModel";
import UserModel from "../domain/user/User";
import { UserType } from "../domain/user/UserConstants";

export const enum AuthMessageTemplateNames {
    ACCOUNT_EMAIL_VERIFICATION = "ACCOUNT_EMAIL_VERIFICATION",
    FORGOT_PASSWORD = "FORGOT_PASSWORD",
    REQUEST_SERVICE_UPGRADE = "REQUEST_SERVICE_UPGRADE",
    REGISTER_INVITED_USER = "REGISTER_INVITED_USER",
    ORG_REGISTRATION_REQUEST = "ORG_REGISTRATION_REQUEST",
    ORG_REGISTRATION_APPROVED = "ORG_REGISTRATION_APPROVED",
    ORG_REGISTRATION_REJECTED = "ORG_REGISTRATION_REJECTED",
}

export interface UserDetails {
    name: string;
    email?: string;
    organizationName?: string;
    userType?: string;
}

export interface VerificationMessageProps extends UserDetails {
    verificationLink: string;
}

export interface ServiceUpgradeTemplateProps {
    user: UserModel;
    link?: string;
}

export interface InvitedUserRegisterProps {
    user: InvitedUser;
    link: string;
    universityName: string;
}

export interface OrganizationRegistrationRequestProps {
    firstUser: UserModel;
}

class AuthMessageTemplates {
    static serviceName = "AuthTemplates";

    public static getAccountEmailVerificationMessage(
        props: VerificationMessageProps
    ) {
        return new MessageModel({
            isInternal: false,
            templateId: AuthMessageTemplateNames.ACCOUNT_EMAIL_VERIFICATION,
            label: MessageLabel.AUTHENTICATION,
            subject: `[I-Stem] Please verify your email to access I-Stem portal`,
            body: `<p>Welcome Aboard!!!</p>
    <p>Hi ${props.name}</p>
    <p>Thanks for creating account with I-Stem. Please click on the following link to verify your email id.</p> <a href="${props.verificationLink}">Verify your email</a>
    <p>I-Stem</p>`,
        });
    }

    public static getForgotPasswordMessage(props: VerificationMessageProps) {
        return new MessageModel({
            isInternal: false,
            templateId: AuthMessageTemplateNames.FORGOT_PASSWORD,
            label: MessageLabel.AUTHENTICATION,
            subject: `[I-Stem] Your reset password link`,
            body: `<p>Hello ${props.name}</p>
         <p>We have received a request to reset the password for this account. Please click <a href="${props.verificationLink}">here</a> to reset your password.</p>
         <p>I-Stem</p>`,
        });
    }
    public static getServiceUpgradeMessage(
        props: ServiceUpgradeTemplateProps
    ): MessageModel {
        return new MessageModel({
            isInternal: true,
            subject: `Hey! you got service upgrade request from ${props.user?.fullname}`,
            label: MessageLabel.REQUEST_SERVICE_UPGRADE,
            templateId: AuthMessageTemplateNames.REQUEST_SERVICE_UPGRADE,
            body: `<p>Hello I-Stem!</p>
            <p>You have one more I-Stem service upgradation request:</p>
            <ul>
            <li>Full Name: ${props.user?.fullname}</li>
            <li>Email: ${props.user?.email}</li>
            <li>Current Role: ${props.user.role}</li>
            </ul>
            <p>Click on the <a href=${props.link}>Link</a> to visit I-Stem Admin Panel </p>
            `,
        });
    }

    public static getInvitedUserRegisterMessage(
        props: InvitedUserRegisterProps
    ): MessageModel {
        let businessOrUniversity;
        if (props.user.userType === UserType.BUSINESS) {
            businessOrUniversity = "organization";
        } else {
            businessOrUniversity = "university";
        }
        return new MessageModel({
            isInternal: false,
            subject: `[I-Stem] Please register your account to access I-Stem portal`,
            label: MessageLabel.INVITATION,
            templateId: AuthMessageTemplateNames.REGISTER_INVITED_USER,
            body: `<p>Hello ${
                props.user.fullName?.length
                    ? props.user.fullName
                    : props.user.email
            }</p>
            <p>You have been invited to I-Stem portal by your ${businessOrUniversity} ${
                props.universityName
            }</p>
            <p>Please click <a href=${
                props.link
            }>here</a> to create your account</p>
            <p>Team I-Stem</p>
            `,
        });
    }

    public static getNewOrganizationRegistrationRequestMessage(
        props: OrganizationRegistrationRequestProps
    ) {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.ISTEM_ADMIN_FLOW,
            templateId: AuthMessageTemplateNames.ORG_REGISTRATION_REQUEST,
            subject: `Hey, you have new organization registration request`,
            body: `
            <p>Hello I-Stem</p>
            <p>You have new organization request by user:</p>
            <pre>${getFormattedJson(props.firstUser)}</pre>
            <p>Visit I-Stem Admin Panel to approve or reject the reject.</p>
            `,
        });
    }

    public static getNewOrganizationRequestApprovalMessage(props: UserDetails) {
        let businessMessage;
        let employeeOrStudent;
        if (props.userType === UserType.BUSINESS) {
            employeeOrStudent = "employees";
            businessMessage =
                "<li>Hire people with disabilities from the I-Stem community.</li>";
        } else {
            employeeOrStudent = "students";
        }
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.INVITATION,
            templateId: AuthMessageTemplateNames.ORG_REGISTRATION_APPROVED,
            subject: `[I-Stem] Organization Account Approved!!!`,
            body: `
            <p>Hello ${props.name}</p>
            <p>Welcome aboard!!</p>
            <p>Your request to create organization account for your organization ${props.organizationName} has been approved by I-Stem.</p>
<p>Now you could log into I-Stem portal and could try out the following things:</p>
<ul>
<li>Create a profile of your organization.</li>
<li>Can invite your colleagues as "staff" to manage administrative tasks.</li>
<li>Invite your ${employeeOrStudent} to access AI-powered I-Stem accommodation services.</li>
<li>Track  metrics about the different accommodation services used by ${employeeOrStudent}.</li>
${businessMessage}
<li>And much more!!</li>
</ul>

<p>If you face any problem or you have any suggestion/doubt, don't hesitate, reach out I-Stem team at info@inclusivestem.org. We are here to help.</p>

<p>Team I-Stem</p>
            `,
        });
    }

    public static getNewOrganizationRegistrationRequestRejectionMessage(
        props: UserDetails
    ) {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.INVITATION,
            templateId: AuthMessageTemplateNames.ORG_REGISTRATION_REJECTED,
            subject: `[I-Stem] Sorry, couldn't create organization account`,
            body: `
            <p>Hello ${props.name}</p>
            <p>We were unable to create a new organization account for organization name ${props.organizationName}. Either an organization account already exists for this organization or we don't have enough information to verify it is a real organization.</p>
            <p>If you think its a mistake, please drop us an email at info@inclusivestem.org and we will be more than happy to discuss it further and resolve the issue. </p>

            <p>Team I-Stem</p>
            `,
        });
    }
}

export default AuthMessageTemplates;
