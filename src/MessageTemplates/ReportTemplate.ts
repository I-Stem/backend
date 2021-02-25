import UserModel from "../domain/user/User";
import {MessageModel} from '../domain/MessageModel';
import { MessageLabel } from '../domain/MessageModel/MessageConstants';

export const enum ReportMessageTemplateNames {
    METRICS_REPORT = "METRICS_REPORT",
}

export interface OrganizationReportProps {
    user: UserModel;
    url: string;
}

class ReportTemplate {
    public static getGenerateReportForMetricsMessage(
        props: OrganizationReportProps
    ): MessageModel {
        return new MessageModel({
            isInternal: false,
            label: MessageLabel.REPORT,
            templateId: ReportMessageTemplateNames.METRICS_REPORT,
            subject: `[I-Stem] Here is your requested report`,
            body: `<p>Hello ${props.user.fullname}</p>
            <p>Click <a href="${props.url}">here</a> to download the generated report for your organization: ${props.user.organizationName}</p>
            <p>Team I-Stem</p>
            `,
        });
    }
}

export default ReportTemplate;
