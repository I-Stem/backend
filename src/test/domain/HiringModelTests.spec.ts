import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {FileModelStubs} from "../mocks/domain/FileModelStubs";
import {JobPreferencesModelStubs} from "../mocks/domain/JobPreferencesModelStubs";
import {JobPreferencesModel} from "../../domain/Community/JobPreferencesModel";
import HiringModel from "../../domain/organization/HiringModel";
import { HiringAction, JobNature } from '../../domain/Community/JobPreferencesModel/JobPreferencesConstants';

describe('domain level operation for hiring actions', () => {
    const applicant = UserModelStubs.JohnSnow;
    const hr = UserModelStubs.AryaStark;
const resume = FileModelStubs.SongOfIceAndFire;
const application = JobPreferencesModelStubs.application;

        before(async function() {
    await dbHandler.createConnection();
    await applicant.persist();
    await hr.persist();
    await resume.persist();
    application.inputFileId = resume.fileId;
    application.userId = applicant.userId;
    await application.persistJobPreferences(applicant.userId);
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should send email to applicant', async () => {
await HiringModel.contactCandidate(`Invitation to winterfell`, 
`your watch is complete.`,
hr,
application.jobPreferenceId
);
        });

       it("should return comments on an applicant", async function() {
           const result = await HiringModel.commentsForCandidate(application.jobPreferenceId, hr.organizationCode);

           expect(result.length).to.be.equal(0);
       });

       it("should update new action to application", async function() {
await HiringModel.updateBusinessAction(hr.organizationCode,
    HiringAction.COMMENTED,
    application.jobPreferenceId,
    hr.userId,
    "approved, its quite exciting");
       });

       it("should filter the database", async function() {
           await HiringModel.hiringFilter({
               jobType: JobNature.FULL_TIME
           },
           hr.organizationCode,
           "");
       })
    });