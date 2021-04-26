import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import {VCProcess} from "../../domain/VCProcess";
import db from "../dbHandler";
import FileModel from "../../domain/FileModel";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {VCProcessStubs} from "../mocks/domain/VCProcessStubs";
import {VCModelStubs} from "../mocks/domain/VCModelStubs";
import vcResponseQueue, { VcResponseQueue} from "../../queues/VcResponse";
import FileService from "../../services/FileService";



describe("Must call video insight result API successfully", async function() {
    let inputFile: FileModel = FileModelStubs.GOT;
    const fileOwner = UserModelStubs.JohnSnow;
    const vcProcess = VCProcessStubs.vcProcess;
    const vcRequest = VCModelStubs.vcRequest;
    
        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
    await fileOwner.persist();
    inputFile.userContexts[0].userId = fileOwner.userId;
            await inputFile.persist();
            vcProcess.inputFileId = inputFile.fileId;
            await vcProcess.persist();

            vcRequest.userId = fileOwner.userId;
            vcRequest.inputFileId = inputFile.fileId;
            vcRequest.associatedProcessId = vcProcess.processId;
            await vcRequest.persist();

                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must get 200 response from insight result API server", async function() {

        //mock http endpoint

        nock(process.env.SERVICE_API_HOST)
        .post(`/api/v1/vc/callback`)
        .reply(200, {
            hash: "amazing" + new Date().toString()
        });
await vcProcess.addVCRequest(vcRequest.vcRequestId);


        await vcResponseQueue.startVideoInsightResultAPI({
            data:            vcProcess
        }, () => {
            console.log("video insight results retrieved of file  ");
        });
   
await vcProcess.clearWaitingQueue();
    });

it("must handle insight result API failure", async function() {
//mock http endpoint

nock(process.env.SERVICE_API_HOST)
.post(`/api/v1/vc/callback`)
.reply(500, {
    message: "successfully received"
});

await vcProcess.addVCRequest(vcRequest.vcRequestId);
await vcResponseQueue.startVideoInsightResultAPI({
    data: vcProcess,
}, () => {
    console.log("insight result request processing complete");
});

})

});