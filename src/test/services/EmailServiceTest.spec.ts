import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import EmailQueue, { MessageQueue } from "../../queues/message";
import emailService, { EmailService } from "../../services/EmailService";
import { MessageModel } from "../../domain/MessageModel";
import UserModel from "../../domain/user/User";
import { InvitedUser } from "../../domain/InvitedUserModel";


describe("test email service", async function() {
    it("should check email types", async function() {
            //setting up mocks
    const emailQueueDispatchStub = Sinon.stub(MessageQueue.prototype, "dispatch");
    //const emailServiceStub = Sinon.stub(EmailService.prototype, "sendEmailPromise").resolves();
    await emailService.reportCustomerFeedback({} as MessageModel);
    await emailService.reportJobApplication({} as MessageModel);
    await emailService.reportMentorship({} as MessageModel);
    await emailService.sendEmailToCandidate({} as MessageModel, {email: "sun"} as UserModel, []);
    await emailService.sendEmailToEscalator({} as MessageModel, undefined);
    await emailService.sendEmailToInvitedUser({} as MessageModel, {email: "sun"} as InvitedUser);
    await emailService.sendEmailToOrganization("sun", {} as MessageModel);
    await emailService.sendEmailToUser({email: "sun", userId: "14"} as UserModel, {} as MessageModel);
    await emailService.sendEscalationMessage({} as MessageModel);
    await emailService.sendInternalDiagnosticEmail({} as MessageModel);
    await emailService.serviceUpgradeRequest({} as MessageModel);
    //await emailService.sendEmailMessage({} as MessageModel);
    emailQueueDispatchStub.restore();
    //emailServiceStub.restore();
    });
});