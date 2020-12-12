import loggerFactory from '../middlewares/WinstonLogger';
import MessageModel from '../domain/MessageModel';
import EmailQueue from '../queues/message';
import UserModel from '../domain/User';
import { InvitedUser } from '../domain/InvitedUserModel';

const mailer = require('nodemailer-promise');
const aws = require('aws-sdk');

const  sendEmail = mailer.config({
    service: 'ses',
    SES: new aws.SES({
        apiVersion: '2010-12-01',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sslEnabled: true,
        region: process.env.AWS_REGION
    })
});

class EmailService {
static ServiceName = 'EmailService';

private sendEmailPromise = function (message: any) {
    const methodname = 'sendEmailPromise';
    const logger = loggerFactory(EmailService.ServiceName, methodname);
    return new Promise((resolve, reject) => {
        sendEmail(message)
            .then((info: String) => {
                logger.info('AWS email service response: %o', info);
                resolve(info);
            }) // if successful
            .catch((err: Error) => {
                logger.error(err);
                reject(err);
            });
    });
};

public sendInternalDiagnosticEmail(message: MessageModel) {
const logger = loggerFactory(EmailService.ServiceName, 'sendInternalDiagnosticEmail');

if (process.env.DIAGNOSTIC_EMAIL_REPORTING_ENABLED === 'true') {
logger.info(`sending diagnostic email to ${process.env.DIAGNOSTIC_EMAIL}`);
message.receiverEmail = process.env.DIAGNOSTIC_EMAIL;
EmailQueue.dispatch(message);
} else {
logger.info('skipping diagnostic email');
}
}

public async reportCustomerFeedback(message: MessageModel) {
    if (process.env.CUSTOMER_FEEDBACK_REPORTING_ENABLED === 'true') {
        message.receiverEmail = process.env.CUSTOMER_FEEDBACK_RECEIVING_EMAIL;
        EmailQueue.dispatch(message);
    }
}

public async reportJobApplication(message: MessageModel) {
    message.receiverEmail = process.env.JOB_APPLICATION_RECEIVING_EMAIL;
    EmailQueue.dispatch(message);
}
public async reportMentorship(message: MessageModel) {
    message.receiverEmail = process.env.JOB_APPLICATION_RECEIVING_EMAIL;
    EmailQueue.dispatch(message);
}

public async sendEscalationMessage(message: MessageModel) {
    message.receiverEmail = process.env.ESCALATION_EMAIL;
    EmailQueue.dispatch(message);
}

public async serviceUpgradeRequest(message: MessageModel) {
    message.receiverEmail = process.env.CUSTOMER_FEEDBACK_RECEIVING_EMAIL;
    EmailQueue.dispatch(message);
}

public async notifyIStemTeam(message: MessageModel) {
    message.receiverEmail = process.env.CUSTOMER_FEEDBACK_RECEIVING_EMAIL;
    EmailQueue.dispatch(message);
}

public async sendEmailToUser(user: UserModel, message: MessageModel) {
    const logger = loggerFactory(EmailService.ServiceName, 'sendEmailToUser');
    logger.info('sending email to user: ' + user.email);
    message.receiverEmail = user.email;
    message.receiverId = user.userId;
    EmailQueue.dispatch(message);
}

public async sendEmailToInvitedUser(message: MessageModel, user: InvitedUser){
    const logger = loggerFactory(EmailService.ServiceName, 'sendEmailToInvitedUser');
    logger.info('sending email to user: ' + user.email);
    message.receiverEmail = user.email;
    message.receiverId = user._id;
    EmailQueue.dispatch(message);
}

 public sendMail(mesg: any) {
    const methodname = 'sendmail';
    const logger = loggerFactory(EmailService.ServiceName, methodname);
    const msg = {
        html: mesg.body,
        text: mesg.text,
        to: mesg.to,
        subject: mesg.subject,
        from: process.env.EMAIL_FROM_ADDRESS
    };
    this.sendEmailPromise(msg)
        .then(() => {
            logger.info('email sent');
        })
        .catch((err) => {
            logger.error(err);
        });
}

public sendEmailMessage(message: MessageModel): void {
const logger = loggerFactory(EmailService.ServiceName, 'sendEmailMessage');
logger.info('receiver email: ' + message.receiverEmail);
const msg = {
        html: message.body,
        text: message.text,
        to: message.receiverEmail,
        subject: message.subject,
        from: process.env.EMAIL_FROM_ADDRESS
    };
this.sendEmailPromise(msg)
        .then(() => {
            logger.info('email sent');
        })
        .catch((err) => {
            logger.error(err);
        });

}
}

const emailService = new EmailService();
export default emailService;
