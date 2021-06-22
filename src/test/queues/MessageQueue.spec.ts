import Sinon from "sinon";
import chai, { expect } from "chai";
import db from "../dbHandler";
import messageQueue, {MessageQueue } from "../../queues/message";
import emailService, { EmailService } from "../../services/EmailService";
import AuthMessageTemplates from "../../MessageTemplates/AuthTemplates";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";


describe("Must send successful email for dispatch", async function() {

    const fileOwner = UserModelStubs.JohnSnow;

        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
    await fileOwner.persist();
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must send message without saving", async function() {

        //setting up mocks
        const emailQueueDispatchStub = Sinon.stub(emailService, "sendEmailMessage");

        await messageQueue.deliverMessage({
            data: {
...AuthMessageTemplates.getAccountEmailVerificationMessage({
    name: fileOwner.fullname,
    email: fileOwner.email,
    verificationLink: "here"
}),
isInternal: true
            }
        }, () => {
            console.log("message request dropped successfully");
        });
   
        expect(emailQueueDispatchStub.callCount).to.equal(1);
        emailQueueDispatchStub.restore();
    });

    it("must send message with saving", async function() {

        //setting up mocks
        const emailQueueDispatchStub = Sinon.stub(emailService, "sendEmailMessage");

        await messageQueue.deliverMessage({
            data: {
...AuthMessageTemplates.getAccountEmailVerificationMessage({
    name: fileOwner.fullname,
    email: fileOwner.email,
    verificationLink: "here"
})
            }
        }, () => {
            console.log("message request dropped successfully");
        });
   
        expect(emailQueueDispatchStub.callCount).to.equal(1);
        emailQueueDispatchStub.restore();
    });


});
