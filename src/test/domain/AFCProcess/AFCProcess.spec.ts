import {AFCProcess} from "../../../domain/AFCProcess";
import { AFCProcessStubs } from "../../mocks/domain/AFCProcessStubs";
import db from "../../dbHandler";
import chai, { expect } from "chai";
import Sinon from "sinon";
import FileModel from "../../../domain/FileModel";
import { FileModelStubs } from "../../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../../mocks/domain/UserModelStubs";
import {AfcModelStubs} from "../../mocks/domain/AfcModelStubs";
import afcRequestQueue, { AfcRequestQueue } from "../../../queues/afcRequest";
import afcResponseQueue, { AfcResponseQueue } from "../../../queues/afcResponse";
import FileService from "../../../services/FileService";

describe("Test for AFCProcess model lifecycle", function () {
let inputFile: FileModel = FileModelStubs.SongOfIceAndFire;
const fileOwner = UserModelStubs.JohnSnow;
const afcProcess = AFCProcessStubs.afcProcess;
const afcRequest = AfcModelStubs.afcRequest;

    before(async function() {
        await db.createConnection();
        console.log("setting up the environment");
await fileOwner.persist();
inputFile.userContexts[0].userId = fileOwner.userId;
        inputFile = await FileModelStubs.SongOfIceAndFire.persist();
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
await afcProcess.persist();
afcProcess.processId.toString().length.should.greaterThan(20);
    });

it("Must add an afc request in waiting queue", function() {
afcProcess.addAFCRequest(afcRequest.afcRequestId);
console.log("length of queue: " + afcProcess.ocrWaitingQueue.length);
afcProcess.ocrWaitingQueue.length.should.be.equal(1);
afcProcess.clearWaitingQueue();
afcProcess.ocrWaitingQueue.length.should.be.equal(0);
console.log("length of queue: " + afcProcess.ocrWaitingQueue.length);
});

it("must call AfcRequest queue for OCR", async function () {
    //setting up mocks
    const afcRequestQueueDispatchStub = Sinon.stub(AfcRequestQueue.prototype, "dispatch");

await afcRequest.initiateAFCProcessForRequest(afcProcess, inputFile);
afcProcess.ocrWaitingQueue.length.should.be.equal(1);

//dismantling
afcProcess.clearWaitingQueue();
expect(afcRequestQueueDispatchStub.called).to.equal(true);
expect(afcRequestQueueDispatchStub.callCount).to.equal(1);
afcRequestQueueDispatchStub.restore();
});

it("should format afc request OCR output", async function() {
    //mocking
    const afcResponseQueueDispatchStub = Sinon.stub(AfcResponseQueue.prototype, "dispatch");
afcProcess.addAFCRequest(afcRequest.afcRequestId);

await afcProcess.formatOutput();

expect(afcResponseQueueDispatchStub.called).to.equal(true);
expect(afcResponseQueueDispatchStub.callCount).to.equal(1);
afcResponseQueueDispatchStub.restore();
});

});