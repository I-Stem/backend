import db from "../dbHandler";
import chai, { expect } from "chai";
import Sinon from "sinon";
import {VCProcess} from "../../domain/VCProcess";
import {VCProcessStubs} from "../mocks/domain/VCProcessStubs";
import FileModel from "../../domain/FileModel";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {VCModelStubs} from "../mocks/domain/VCModelStubs";
import FileService from "../../services/FileService";
import {VcRequestQueue} from "../../queues/vcRequest";
import {VcResponseQueue} from "../../queues/VcResponse";

describe("Test for VCProcess model lifecycle", function () {
let inputFile: FileModel = FileModelStubs.GOT;
const fileOwner = UserModelStubs.JohnSnow;
const vcProcess = VCProcessStubs.vcProcess;
const vcRequest = VCModelStubs.vcRequest;

    before(async function() {
        await db.createConnection();
        console.log("setting up the environment");
await fileOwner.persist();
inputFile.userContexts[0].userId = fileOwner.userId;
        inputFile = await FileModelStubs.GOT.persist();
        vcProcess.inputFileId = inputFile.fileId;
        vcRequest.userId = fileOwner.userId;
        vcRequest.inputFileId = inputFile.fileId;
        await vcRequest.persist();
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });
            
    it("Should create and persist a successful VC process", async function () {
await vcProcess.persist();
vcProcess.processId.toString().length.should.greaterThan(20);
    });

it("Must add an vc request in waiting queue", function() {
vcProcess.addVCRequest(vcRequest.vcRequestId);
vcProcess.insightWaitingQueue.length.should.be.equal(1);
vcProcess.clearWaitingQueue();
vcProcess.insightWaitingQueue.length.should.be.equal(0);
});

it("must call vcRequest queue for video insights", async function () {
    //setting up mocks
    const vcRequestQueueDispatchStub = Sinon.stub(VcRequestQueue.prototype, "dispatch");

await vcRequest.initiateVCProcessForRequest(vcProcess, inputFile);
vcProcess.insightWaitingQueue.length.should.be.equal(1);

//dismantling
vcProcess.clearWaitingQueue();
expect(vcRequestQueueDispatchStub.called).to.equal(true);
expect(vcRequestQueueDispatchStub.callCount).to.equal(1);
vcRequestQueueDispatchStub.restore();
});

it("should get results of video insights", async function() {
    //mocking
    const vcResponseQueueDispatchStub = Sinon.stub(VcResponseQueue.prototype, "dispatch");
vcProcess.addVCRequest(vcRequest.vcRequestId);

await vcProcess.retrieveVideoInsightResults();

expect(vcResponseQueueDispatchStub.called).to.equal(true);
expect(vcResponseQueueDispatchStub.callCount).to.equal(1);
vcResponseQueueDispatchStub.restore();
});

});