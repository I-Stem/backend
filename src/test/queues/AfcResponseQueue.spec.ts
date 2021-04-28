import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import {AFCProcess} from "../../domain/AFCProcess";
import { AFCProcessStubs } from "../mocks/domain/AFCProcessStubs";
import db from "../dbHandler";
import FileModel, { FileCoordinate } from "../../domain/FileModel";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {AfcModelStubs} from "../mocks/domain/AfcModelStubs";
import afcResponseQueue, { AfcResponseQueue } from "../../queues/afcResponse";
import FileService from "../../services/FileService";


describe("Must call formatting API successfully", async function() {
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
                
    
    it("must get 200 response from OCR API server", async function() {

        //mock http endpoint

        nock(process.env.SERVICE_API_HOST)
        .post(`/api/v1/ocr/format`)
        .reply(200, {
            hash: "amazing"
        });

        //setting up mocks
        const fileServiceGetFileStub = Sinon.stub(FileService, "getFileDataByS3Key").callsFake(async (conaainer, fileKey) => {
            return {
                Body: Buffer.from(`{"message": "Hello world"}`)
            }
        });
afcProcess.ocrJSONFile = new FileCoordinate("container", "fileKey");
        await afcProcess.persist();

        await afcResponseQueue.makeFormattingRequest({
            data: {
            afcProcess: afcProcess,
                outputFormats: [afcRequest.outputFormat]
            }
        }, () => {
            console.log("formatting of file  request processing complete");
        });
   
        fileServiceGetFileStub.restore();
    });

it("must handle Formatting API failure", async function() {
//mock http endpoint

nock(process.env.SERVICE_API_HOST)
.post(`/api/v1/ocr/format`)
.reply(500, {
    message: "successfully received"
});

//setting up mocks
const fileServiceGetFileStub = Sinon.stub(FileService, "getFileDataByS3Key").callsFake(async (conaainer, fileKey) => {
    return {
        Body: Buffer.from(`{"message": "Hello world"}`)
    }
});

afcProcess.ocrJSONFile = new FileCoordinate("container", "fileKey");
        await afcProcess.persist();

await afcProcess.addAFCRequest(afcRequest.afcRequestId);
await afcResponseQueue.makeFormattingRequest({
    data: {
    afcProcess: afcProcess,
        outputFormats: [afcRequest.outputFormat]
    }
}, () => {
    console.log("formatting request processing complete");
});

fileServiceGetFileStub.restore();
})

});