import { expect } from "chai";
import { InvitedUserModel } from "../../domain/InvitedUserModel";
import { InvitationType, InvitedUserEnum } from "../../domain/InvitedUserModel/InvitedUserConstants";
import { UniversityRoles } from "../../domain/organization/OrganizationConstants";
import { UserType } from "../../domain/user/UserConstants";
import db from "../dbHandler";
import {InvitedUserModelStubs} from "../mocks/domain/InvitedUserModelStubs";
import { OrganizationModelStubs } from "../mocks/domain/OrganizationModelStubs";

describe("Unit Tests for Invited User Model", function () {
const invitedUser = InvitedUserModelStubs.sansa;
const organization = OrganizationModelStubs.winterfellUniversity;

    before(async () => {
        await db.createConnection();
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });

    it("should create a new student invited by university", async function () {
        await InvitedUserModel.persistInvitedUser([
            {
                ...invitedUser
            },
        ], 
     InvitationType.FIRST_USER);

    });

    it("should get user from db", async function() {
        await InvitedUserModel.persistInvitedUser([
            {
                ...invitedUser
            },
        ], 
     InvitationType.ORGANIZATION);
        const result = await InvitedUserModel.getInvitedUserByEmail(invitedUser.email);
        expect(result.fullName).to.be.equal(invitedUser.fullName);
    });

    it("should give a valid user value true", async function() {
        const result = await InvitedUserModel.checkInvitedUser(invitedUser.email, "token");
        expect(result).to.be.equal(true);
    });

    it("should update status", async function() {
        const result = await InvitedUserModel.updateStatus(invitedUser.email, InvitedUserEnum.REGISTERED);

    });


});
