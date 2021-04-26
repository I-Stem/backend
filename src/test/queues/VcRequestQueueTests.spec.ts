import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import {VCProcess} from "../../domain/VCProcess";
import { VCProcessStubs} from "../mocks/domain/VCProcessStubs";
import db from "../dbHandler";
import FileModel from "../../domain/FileModel";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {VCModelStubs} from "../mocks/domain/VCModelStubs";
import vcRequestQueue, { VcRequestQueue } from "../../queues/vcRequest";
import FileService from "../../services/FileService";

describe("Must call video insight API successfully", async function() {
    let inputFile: FileModel = FileModelStubs.GOT;
    const fileOwner = UserModelStubs.JohnSnow;
    const vcProcess = VCProcessStubs.vcProcess;
    const vcRequest = VCModelStubs.vcRequest;
    
        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
    await fileOwner.persist();
    inputFile.userContexts[0].userId = fileOwner.userId;
            inputFile = await inputFile.persist();
            vcProcess.inputFileId = inputFile.fileId;
            vcRequest.userId = fileOwner.userId;
            vcRequest.inputFileId = inputFile.fileId;
            await vcRequest.persist();
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must get 200 response from video insight API server", async function() {

        //mock http endpoint

        nock(process.env.SERVICE_API_HOST)
        .post(`/api/v1/vc`)
        .reply(200, {
            message: "successfully submitted the file",
            id: "unique"
        });

        //setting up mocks
        const fileServiceGetFileStub = Sinon.stub(FileService, "getPresignedURL").callsFake(async (conaainer, fileKey) => {
            return "https://github.com/link/to/video";
                        });

        await vcRequestQueue.startVideoInsightRequest({
            data: {
            vcProcessData: vcProcess,
                inputFile: inputFile,
            }
        }, () => {
            console.log("video insight api  request complete");
        });
   
        fileServiceGetFileStub.restore();
    });

it("must handle video insight API failure", async function() {
//mock http endpoint

nock(process.env.SERVICE_API_HOST)
.post(`/api/v1/vc`)
.reply(500, {
    message: "successfully received"
});

//setting up mocks
const fileServiceGetFileStub = Sinon.stub(FileService, "getPresignedURL").callsFake(async (conaainer, fileKey) => {
    return "https://github.com/link/to/video";
});

await vcProcess.addVCRequest(vcRequest.vcRequestId);
await vcRequestQueue.startVideoInsightRequest({
    data: {
    vcProcessData: vcProcess,
        inputFile: inputFile,
    }
}, () => {
    console.log("video insight request complete");
});

fileServiceGetFileStub.restore();
})

});