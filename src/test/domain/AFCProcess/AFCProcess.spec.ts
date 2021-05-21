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
import afcRequestQueue, { AfcRequestQueue } from "../../../queues/afcRequest";
import afcResponseQueue, { AfcResponseQueue } from "../../../queues/afcResponse";
import FileService from "../../../services/FileService";
import {s3} from "../../../utils/file";
import emailService from "../../../services/EmailService";
import { AFCRequestOutputFormat, AFCRequestStatus } from "../../../domain/AfcModel/AFCConstants";
import { ManagedUpload } from "aws-sdk/clients/s3";

describe("Test for AFCProcess model lifecycle", function () {
let inputFile: FileModel = new FileModel(FileModelStubs.SongOfIceAndFire);
const fileOwner = new UserModel(UserModelStubs.JohnSnow);
const afcProcess = new AFCProcess({...AFCProcessStubs.afcProcess});
const afcRequest = new AfcModel(AfcModelStubs.afcRequest);

    before(async function() {
        await db.createConnection();
        console.log("setting up the environment");
await fileOwner.persist();
inputFile.userContexts[0].userId = fileOwner.userId;
        inputFile = await inputFile.persist();
        afcProcess.inputFileId = inputFile.fileId;
        afcRequest.userId = fileOwner.userId;
        afcRequest.inputFileId = inputFile.fileId;
        await afcRequest.persist();
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });
            
    it("Should create and persist a successful AFC process", async function () {
const result = await AFCProcess.findOrCreateAFCProcess(afcProcess);
result.processId.toString().length.should.greaterThan(20);
    });

it("Must add an afc request in waiting queue", async function() {
    await afcProcess.clearWaitingQueue();
afcProcess.ocrWaitingQueue.length.should.be.equal(0);

await afcProcess.addAFCRequest(afcRequest.afcRequestId);
console.log("length of queue: " + afcProcess.ocrWaitingQueue.length);
afcProcess.ocrWaitingQueue.length.should.be.equal(1);

return afcProcess.clearWaitingQueue();
});

it("must call AfcRequest queue for OCR", async function () {
    //setting up mocks
    const afcRequestQueueDispatchStub = Sinon.stub(AfcRequestQueue.prototype, "dispatch");

await afcRequest.initiateAFCProcessForRequest(afcProcess, inputFile);
afcProcess.ocrWaitingQueue.length.should.be.equal(1);

//dismantling
await afcProcess.clearWaitingQueue();
expect(afcRequestQueueDispatchStub.called).to.equal(true);
expect(afcRequestQueueDispatchStub.callCount).to.equal(1);
afcRequestQueueDispatchStub.restore();
});

it("should format afc request OCR output", async function() {
    //mocking
    const afcResponseQueueDispatchStub = Sinon.stub(AfcResponseQueue.prototype, "dispatch");
await afcProcess.addAFCRequest(afcRequest.afcRequestId);

await afcProcess.formatOutput();
await afcProcess.clearWaitingQueue();
expect(afcResponseQueueDispatchStub.called).to.equal(true);
expect(afcResponseQueueDispatchStub.callCount).to.equal(1);
afcResponseQueueDispatchStub.restore();
});

it("should return existing afc process", async function() {
    const result1 = await AFCProcess.findOrCreateAFCProcess(afcProcess);
    const result2 = await AFCProcess.findOrCreateAFCProcess(afcProcess);
expect(result1.processId.toString()).to.be.equal(result2.processId.toString());
});


it("should complete all the pending requests", async function() {
    await afcProcess.addAFCRequest(afcRequest.afcRequestId);
    await afcProcess.finishPendingUserRequests();

});
it("should successfully retrieve afc Process", async function() {
    const result1 = await AFCProcess.findOrCreateAFCProcess(afcProcess);
const result = await AFCProcess.getAFCProcessById(result1.processId);
const result2 = await AFCProcess.getAFCProcess(inputFile.hash, afcProcess.ocrType, afcProcess.ocrVersion);
expect(result).to.be.not.null;
expect(result2).to.be.not.null;
});

it("should return correct expirytime", function() {
    const expiryTime = AFCProcess.getExpiryTime(121);
    expect(expiryTime.getTime()).to.be.greaterThan(new Date().getTime() + 3600*1000);
});

it("should send generic failure email message", async function() {
const emailServiceStub = Sinon.stub(emailService);
await AFCProcess.notifyErrorInAFCProcessFlow(
    null,
    "response",
    "unknown",
    "stacktrace",
    "undefined",
    AFCRequestStatus.OCR_FAILED
);
expect(emailServiceStub.sendInternalDiagnosticEmail.callCount).to.to.be.equal(1);
Sinon.restore();
});

it("should check update logic", async function() {

    //stubbing real s3 call
    const s3Stub = Sinon.stub(ManagedUpload.prototype, "promise").callsFake(() => {
        return new Promise((resolve, reject) => {
                    return resolve({Location:  "online", Bucket: "b", Key: "k", ETag: "e"});
                });
    });

const subject = await new AFCProcess({...afcProcess});
await subject.updateOCRResults(inputFile.hash, {"result":"output"}, inputFile);
await subject.updateFormattingResult(afcRequest.outputFormat, inputFile);
await subject.addAFCRequest(afcRequest.afcRequestId);
await subject.finishPendingUserRequests();

expect(s3Stub.callCount).to.be.equal(1);
});
});