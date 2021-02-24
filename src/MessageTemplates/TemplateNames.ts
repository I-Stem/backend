import { AuthMessageTemplateNames } from "./AuthTemplates";
import { EscalationTemplateNames } from "./EscalationTemplates";
import { ExceptionTemplateNames } from "./ExceptionTemplates";
import { FeedbackTemplateNames } from "./FeedbackTemplates";
import { JobApplicationTemplateNames } from "./JobApplicationTemplate";
import { MentorshipTemplateName } from "./MentorshipTemplate";
import { ServiceRequestStatusTemplateNames } from "./ServiceRequestTemplates";
import { HackathonTemplateNames } from "./HackathonTemplate";
import { ReportMessageTemplateNames } from "./ReportTemplate";

export type TemplateName =
    | ExceptionTemplateNames
    | FeedbackTemplateNames
    | MentorshipTemplateName
    | JobApplicationTemplateNames
    | ServiceRequestStatusTemplateNames
    | EscalationTemplateNames
    | AuthMessageTemplateNames
    | HackathonTemplateNames
    | ReportMessageTemplateNames;
