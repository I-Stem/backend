import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import HackathonModel from "../../domain/HackathonModel";
import MLModelModel from '../../domain/MLModelModel';


describe('domain level operation for captioning ml model', () => {
    const applicant = UserModelStubs.JohnSnow;
const model = new MLModelModel({
    name: "universal",
    createdBy: "",
    trainedModelId: "external id",
    trainings: []
});

        before(async function() {
    await dbHandler.createConnection();
    await applicant.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new ml model in database', async () => {
            model.createdBy = applicant.userId
await model.persist();
expect(model.modelId.toString().length).to.be.greaterThan(20);
        });

it("should update training model", async () => {
await model.updateTrainedModelId("hello");
});

it("get model by id", async () => {
const result = await MLModelModel.getModelById(model.modelId);
expect(result.modelId.toString().length).to.be.greaterThan(20);
});

        it("should retrieve all models by user", async () => {
const results = await MLModelModel.getAllUserModels(applicant.userId);
expect(results.length).to.be.equal(1);
        });
    });
