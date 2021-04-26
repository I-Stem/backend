import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import {AFCProcess} from "../../domain/AFCProcess";
import { AFCProcessStubs } from "../mocks/domain/AFCProcessStubs";
import db from "../dbHandler";
import FileModel from "../../domain/FileModel";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {AfcModelStubs} from "../mocks/domain/AfcModelStubs";
import afcRequestQueue, { AfcRequestQueue } from "../../queues/afcRequest";
import FileService from "../../services/FileService";





describe("Must call OCR API successfully", async function() {
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
        .post(`/api/v1/ocr`)
        .reply(200, {
            message: "successfully submitted the file"
        });

        //setting up mocks
        const fileServiceGetFileStub = Sinon.stub(FileService, "getFileDataByS3Key").callsFake(async (conaainer, fileKey) => {
            return {
                Body: Buffer.from("Hello world")
            }
        });

        await afcRequestQueue.makeOCRRequest({
            data: {
            afcProcessData: afcProcess,
                inputFile: inputFile,
            }
        }, () => {
            console.log("ocr request processing complete");
        });
   
        fileServiceGetFileStub.restore();
    });

it("must handle OCR API failure", async function() {
//mock http endpoint

nock(process.env.SERVICE_API_HOST)
.post(`/api/v1/ocr`)
.reply(500, {
    message: "successfully received"
});

//setting up mocks
const fileServiceGetFileStub = Sinon.stub(FileService, "getFileDataByS3Key").callsFake(async (conaainer, fileKey) => {
    return {
        Body: Buffer.from("Hello world")
    }
});

await afcProcess.addAFCRequest(afcRequest.afcRequestId);
await afcRequestQueue.makeOCRRequest({
    data: {
    afcProcessData: afcProcess,
        inputFile: inputFile,
    }
}, () => {
    console.log("ocr request processing complete");
});

fileServiceGetFileStub.restore();
})

});