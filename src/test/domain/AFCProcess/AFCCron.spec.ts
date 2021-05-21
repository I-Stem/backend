import {AFCProcess} from "../../../domain/AFCProcess";
import { AFCProcessStubs } from "../../mocks/domain/AFCProcessStubs";
import db from "../../dbHandler";
import chai, { expect } from "chai";
import Sinon from "sinon";
import FileModel from "../../../domain/FileModel";
import UserModel from "../../../domain/user/User";
import {AfcModel} from "../../../domain/AfcModel";
import { FileModelStubs } from "../../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../../mocks/domain/UserModelStubs";
import {AfcModelStubs} from "../../mocks/domain/AfcModelStubs";



describe("AFC cron test", function() {
    let inputFile: FileModel = new FileModel(FileModelStubs.SongOfIceAndFire);
    const fileOwner = new UserModel(UserModelStubs.JohnSnow);
    const afcProcess = new AFCProcess(AFCProcessStubs.afcProcess);
    const afcRequest = new AfcModel(AfcModelStubs.afcRequest);
    
        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
    
    
    it("must run without alert for no afc process", function() {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 1000*60*60).toISOString();
        const spy = Sinon.spy(AFCProcess.prototype, "notifyWaitingUsersAboutFailure");
AFCProcess.afcCronHandler(hourAgo, now.toISOString());
expect(spy.called).to.be.equal(false);
spy.restore();
    });

it("should fail one AFC process", async function() {

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 1000*60*60);
                //test setup
    await fileOwner.persist();
    inputFile.userContexts[0].userId = fileOwner.userId;
            inputFile = await FileModelStubs.SongOfIceAndFire.persist();
            afcProcess.inputFileId = inputFile.fileId;
            afcProcess.expiryTime = new Date(now.getTime() - 1000 * 30*60);
            await afcProcess.persist();
            afcRequest.userId = fileOwner.userId;
            afcRequest.inputFileId = inputFile.fileId;
            await afcRequest.persist();
            await afcProcess.addAFCRequest(afcRequest.afcRequestId);

            const userNotificationSpy = Sinon.spy(AFCProcess.prototype, "notifyWaitingUsersAboutFailure");
            const istemNotificationSpy = Sinon.spy(AFCProcess, "notifyIStemTeamAboutAFCProcessFailure");

            await AFCProcess.afcCronHandler(hourAgo.toISOString(), now.toISOString());
expect(userNotificationSpy.callCount).to.be.equal(1);
expect(istemNotificationSpy.callCount).to.be.equal(1);
userNotificationSpy.restore();
istemNotificationSpy.restore();
});

});