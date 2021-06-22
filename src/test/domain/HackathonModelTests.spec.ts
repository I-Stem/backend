import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import HackathonModel from "../../domain/HackathonModel";


describe('domain level operation for hackathon', () => {
    const applicant = UserModelStubs.JohnSnow;

        before(async function() {
    await dbHandler.createConnection();
    await applicant.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new hackathon application in database', async () => {
const application = new HackathonModel();
application.persistHackathon(applicant.userId);
        });

        it("should retrieve all hackathons", async () => {
const results = await HackathonModel.hackathonForUser(applicant.userId);
expect(results.length).to.be.equal(1);
        });
    });
