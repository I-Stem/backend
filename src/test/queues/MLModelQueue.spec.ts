import Sinon from "sinon";
import chai, { expect } from "chai";
import nock from "nock";
import MLModelModel from "../../domain/MLModelModel";
import db from "../dbHandler";
import mlModelQueue from "../../queues/MLModelQueue";
import { FileModelStubs } from "../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {AfcModelStubs} from "../mocks/domain/AfcModelStubs";
import afcRequestQueue, { AfcRequestQueue } from "../../queues/afcRequest";
import FileService from "../../services/FileService";





describe("Must call custom model caption training API successfully", async function() {
    const applicant = UserModelStubs.JohnSnow;
const model = new MLModelModel({
    name: "universal",
    createdBy: "",
    trainedModelId: "external id",
    trainings: []
});

    
        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
    await applicant.persist();
    model.createdBy = applicant.userId;
    await model.persist();
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must get 200 response from model training API server", async function() {

        //mock http endpoint

        nock(process.env.SERVICE_API_HOST)
        .post(`/api/v1/customspeech`)
        .reply(200, {
            languageModelId: "working",
            message: "successfully submitted the file"
        });

        await mlModelQueue.requestCustomModelTraining({
            data: {
            triggeringCaseId: model.modelId,
            outputURL: "unknown"
                            }
        }, () => {
            console.log("ocr request processing complete");
        });
   

    });

    it("must handle expected failure from model training API server", async function() {

        //mock http endpoint

        nock(process.env.SERVICE_API_HOST)
        .post(`/api/v1/customspeech`)
        .reply(200, {
            error: true,
            message: "successfully submitted the file"
        });

        await mlModelQueue.requestCustomModelTraining({
            data: {
            triggeringCaseId: model.modelId,
            outputURL: "unknown"
                            }
        }, () => {
            console.log("ocr request processing complete");
        });
   

    });

it("must handle custom model training API unexpected failure", async function() {
//mock http endpoint

nock(process.env.SERVICE_API_HOST)
.post(`/api/v1/customspeech`)
.reply(500, {
    message: "successfully received"
});

await mlModelQueue.requestCustomModelTraining({
    data: {
    triggeringCaseId: model.modelId,
    outputURL: "unknown"
                    }
}, () => {
    console.log("ocr request processing complete");
});



})

});
