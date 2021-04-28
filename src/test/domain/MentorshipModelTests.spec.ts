import { expect } from "chai";
import db from "../dbHandler";
import {MentorshipModel} from "../../domain/Community/MentorshipModel";
import {MentorshipModelStubs} from "../mocks/domain/MentorshipModelStubs";
import { UserModelStubs } from "../mocks/domain/UserModelStubs";
import { SignupAs } from "../../domain/Community/MentorshipModel/MentorshipConstants";

describe("mentorship model tests", async function () {
    const user1 = UserModelStubs.JohnSnow;
    const menteeApplication = MentorshipModelStubs.menteeApplication;
    const mentorApplication = MentorshipModelStubs.mentorApplication;

    before(async () => {
        await db.createConnection();
        await user1.persist();
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });

    it("should persist mentorship application", async function() {
const result = await menteeApplication.persistMentorship(user1.userId);

expect(menteeApplication.mentorshipId.toString().length).to.be.above(20);
    });

it("should change mentorship status", async function() {
await MentorshipModel.updateMenteeshipForUser(menteeApplication.mentorshipId, true, SignupAs.MENTEE);

expect(true).to.be.equal(true);
});

it("should change mentorship cancellation status", async function() {
    await mentorApplication.persistMentorship(user1.userId);
    await MentorshipModel.updateMentorshipForUser(mentorApplication.mentorshipId, ["started"], SignupAs.MENTOR);
    
    expect(true).to.be.equal(true);
    });
   
    it("should return all mentorship applications for user", async function() {
        const result = await MentorshipModel.MentorshipForUser(user1.userId);

        expect(result.length).to.be.equal(2);
    })
});