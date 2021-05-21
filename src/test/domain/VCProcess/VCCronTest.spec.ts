import db from "../../dbHandler";
import chai, { expect } from "chai";
import Sinon from "sinon";
import {VCProcess} from "../../../domain/VCProcess";
import {VCProcessStubs} from "../../mocks/domain/VCProcessStubs";
import FileModel from "../../../domain/FileModel";
import { FileModelStubs } from "../../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../../mocks/domain/UserModelStubs";
import {VCModelStubs} from "../../mocks/domain/VCModelStubs";

describe("Test for VCProcess cron failure", function () {
let inputFile: FileModel = FileModelStubs.GOT;
const fileOwner = UserModelStubs.JohnSnow;
const vcProcess = VCProcessStubs.vcProcess;
const vcRequest = VCModelStubs.vcRequest;

    before(async function() {
        await db.createConnection();
        console.log("setting up the environment");
        /*
await fileOwner.persist();
inputFile.userContexts[0].userId = fileOwner.userId;
        inputFile = await FileModelStubs.GOT.persist();
        vcProcess.inputFileId = inputFile.fileId;
        vcRequest.userId = fileOwner.userId;
        vcRequest.inputFileId = inputFile.fileId;
        await vcRequest.persist();
        */
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });

            it("must run without alert for no vc process", function() {
                const now = new Date();
                const hourAgo = new Date(now.getTime() - 1000*60*60).toISOString();
                const spy = Sinon.spy(VCProcess.prototype, "notifyWaitingUsersAboutFailure");
        VCProcess.vcCronHandler(hourAgo, now.toISOString());
        expect(spy.called).to.be.equal(false);
        spy.restore();
            });
        
            it("should fail one VC process", async function() {

                const now = new Date();
                const hourAgo = new Date(now.getTime() - 1000*60*60);
                            //test setup
                await fileOwner.persist();
                inputFile.userContexts[0].userId = fileOwner.userId;
                        inputFile = await inputFile.persist();
                        vcProcess.inputFileId = inputFile.fileId;
                        vcProcess.expiryTime = new Date(now.getTime() - 1000 * 30*60);
                        await vcProcess.persist();
                        vcRequest.userId = fileOwner.userId;
                        vcRequest.inputFileId = inputFile.fileId;
                        await vcRequest.persist();
                        await vcProcess.addVCRequest(vcRequest.vcRequestId);
            
                        const userNotificationSpy = Sinon.spy(VCProcess.prototype, "notifyWaitingUsersAboutFailure");
                        const istemNotificationSpy = Sinon.spy(VCProcess, "notifyIStemTeamAboutVCProcessFailure");
            
                        await VCProcess.vcCronHandler(hourAgo.toISOString(), now.toISOString());
            expect(userNotificationSpy.callCount).to.be.equal(1);
            expect(istemNotificationSpy.callCount).to.be.equal(1);
            userNotificationSpy.restore();
            istemNotificationSpy.restore();

            return vcProcess.clearWaitingQueue();
            });

        });