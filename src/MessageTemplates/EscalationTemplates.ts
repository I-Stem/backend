import MessageModel, { MessageLabel } from '../domain/MessageModel';

export enum EscalationTemplateNames {
    RAISE_AFC_ESCALATION_TICKET = 'RAISE_AFC_ESCALATION_TICKET',
    RAISE_VC_ESCALATION_TICKET = 'RAISE_VC_ESCALATION_TICKET'
}

export interface RaiseEscalationTicketMessageProps {
    afcRequestDetails?: string;
    vcRequestDetails?: string;
    sourceFileDetails: string;
    inputFileURL: string;
    docOutputFileURL:string;
    escalatorId: string;
    escalatorName: string | number;
escalatorEmail: string;
escalationOf?: string | number;
pageRanges?: string;
}

class EscalationMessageTemplates {

    public static getRaiseAFCTicketMessage(props: RaiseEscalationTicketMessageProps) {
return new MessageModel({
    isInternal: true,
    templateId: EscalationTemplateNames.RAISE_AFC_ESCALATION_TICKET,
    label: MessageLabel.ESCALATION,
    subject: `AFC Escalation raised by ${props.escalatorName}`,
    body:
    `<p>Hello I-Stem</p>
    <p>A request has been escalated, I need your help. details are:</p>
<ul>
<li>Escalator email: ${props.escalatorName}</li>
<li>Escalator Email: ${props.escalatorEmail}</li>
<li>Escalator Id: ${props.escalatorId}</li>
<li>escalated page range: ${props.pageRanges}</li>
<li>Input file: <a href="${props.inputFileURL}">link</a></li>
<li>output word file: <a href="${props.docOutputFileURL}">link</a></li>
<li>afc details: <pre>${props.afcRequestDetails}</pre></li>
<li>source file details: <pre>${props.sourceFileDetails}</pre></li>
</ul>
    `
});
    }

    public static getRaiseVCTicketMessage(props: RaiseEscalationTicketMessageProps) {
        return new MessageModel({
            isInternal: true,
            templateId: EscalationTemplateNames.RAISE_VC_ESCALATION_TICKET,
            label: MessageLabel.ESCALATION,
            subject: `VC Escalation raised by ${props.escalatorName}`,
            body:
            `<p>Hello I-Stem</p>
            <p>A request has been escalated, I need your help. details are:</p>
        <ul>
        <li>Escalator email: ${props.escalatorName}</li>
        <li>Escalator Email: ${props.escalatorEmail}</li>
        <li>Escalator Id: ${props.escalatorId}</li>
        <li>input file: <a href="${props.inputFileURL}">link</a></li>
        <li>output file: <a href="${props.docOutputFileURL}">link</a></li>
        <li>video insight details: <pre>${props.vcRequestDetails}</pre></li>
        <li>Escalation Requested for: ${props.escalationOf}</li>
        <li>source file details: <pre>${props.sourceFileDetails}</pre></li>
        </ul>
            `
        });
            }

}

export default EscalationMessageTemplates;
