import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {FileModelStubs} from "../mocks/domain/FileModelStubs";
import {JobPreferencesModelStubs} from "../mocks/domain/JobPreferencesModelStubs";
import {JobPreferencesModel} from "../../domain/Community/JobPreferencesModel";
import { HighestQualification, JobNature } from '../../domain/Community/JobPreferencesModel/JobPreferencesConstants';

describe('domain level operation for job preferences', () => {
    const applicant = UserModelStubs.JohnSnow;
const resume = FileModelStubs.SongOfIceAndFire;

        before(async function() {
    await dbHandler.createConnection();
    await applicant.persist();
    await resume.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new job preferences application in database', async () => {
            JobPreferencesModelStubs.application.inputFileId = resume.fileId;
const application = JobPreferencesModelStubs.application.persistJobPreferences(applicant.userId);

        });
    });