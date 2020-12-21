/**
 * Define interface for Message Model
 *
 */

export interface Status {
    status: Number;
    actionAt: Date;
}

export interface IMessage {
    triggeredBy: String;
    receiverId: String;
    body: String;
    subject: String;
    text: String;
    link: String;
    label: String;
    status: Number;
    statusLog: Status[];
    templateId: String;
}

export default IMessage;
