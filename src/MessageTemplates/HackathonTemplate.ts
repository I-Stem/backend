import UserModel from "../domain/user/User";
import MessageModel, { MessageLabel } from "../domain/MessageModel";

export enum HackathonTemplateNames {
    HACKATHON_APPLICATION = "HACKATHON_APPLICATION",
    PLATFORM_INVITATION = "PLATFORM_INVITATION"
}

export interface HackathonMessageTemplateProps {
    user: UserModel | null;
    formData: string;
}

class HackathonTemplate {
    public static getHackathonMessage(
        props: HackathonMessageTemplateProps
    ): MessageModel {
        return new MessageModel({
            isInternal: true,
            subject: `Hey! you have recieved a hackathon application from ${props.user?.fullname}`,
            label: MessageLabel.ISTEM_TEAM_NOTIFICATION,
            templateId: HackathonTemplateNames.HACKATHON_APPLICATION,
            body: `<p>Hello I-Stem!</p>
    <p> You have one more hackathon application:</p>
    <ul>
    <li> user name: ${props.user?.fullname}</li>
    <li>email: ${props.user?.email}</li>
    </ul>
    <pre>formdata: ${props.formData}</pre>
    `,
        });
    }

    public static getHackathonPlatformInvitationMessage(user: UserModel) {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.HACKATHON,
            templateId: HackathonTemplateNames.PLATFORM_INVITATION,
            subject: `[I-Stem] Invitation to Inclusive Stem Hackathon 2021 Platform!!`,
            body: 
            `
            <p>
            Hi ${user.fullname},</p>

            ${process.env.HACKATHON_TEXT}
            `
        });
    }
}

export default HackathonTemplate;
