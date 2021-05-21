import UserModel from "../../../domain/user/User";
import db from "../../dbHandler";
import chai, { expect } from "chai";
import { UserType, OAuthProvider, ServiceRoleEnum, ColorThemes, FontThemes } from "../../../domain/user/UserConstants";
import { UserCreationContext } from "../../../domain/user";
import {UniversityRoles} from "../../../domain/organization/OrganizationConstants"
import { InvitationType , InvitedUserEnum} from "../../../domain/InvitedUserModel/InvitedUserConstants";
import {UserModelStubs} from "../../mocks/domain/UserModelStubs";
import { InvitedUserModel } from "../../../domain/InvitedUserModel";
import { UserContext } from "../../../domain/FileModel";
const should = chai.should();

describe("Test for user model lifecycle", function () {
let user = new UserModel({
    ...UserModelStubs.JohnSnow,
password: "WINTER_IS_COMING"
});

    before(async function() {
        await db.createConnection();
        //await user.persist();
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });
            
    it("Should create a successful user", async function () {
        const invitedUser = await InvitedUserModel.persistInvitedUser([{
            email: user.email,
            fullName: user.fullname,
            verifyToken: "hello",
            status: InvitedUserEnum.INVITATION_SENT,
            role: UniversityRoles.STUDENT,
            userType: UserType.UNIVERSITY,
            university: user.organizationName
        }],
        InvitationType.FIRST_USER,
        "hi");

        const dummyUser = await UserModel.registerUser({
            ...user
        }, "hello", undefined, InvitationType.FIRST_USER);

        const dummyUser2 = await UserModel.registerUser({
            ...user,
            email: "hello@yahoo.in",
            oauthProvider: OAuthProvider.PASSWORD
        }, undefined, "onboard/with/us", InvitationType.FIRST_USER);

    });

    it("should successfully compare user password", async function() {
        expect(await user.comparePassword("WINTER_IS_GOING")).to.be.false;
    });

    it("should match id and email identifier", async function() {
        await user.persist();
        const user1 = await UserModel.getUserByEmail(user.email);
        const user2 = await UserModel.getUserById(user.userId);
        expect(user1.fullname).to.be.equal(user2.fullname);

        const user3 = await UserModel.findUserByEmail(user.email);
        expect(user3.fullname).to.be.equal(user2.fullname);
    });

    it("should deduct credits for transaction", async function() {
        await user.deductCredits(25, "nothing");
            });

            
            it("should successfully change roles", async function() {
                await user.changeUserRole(UniversityRoles.STAFF);
                await user.changeUserServiceRole(ServiceRoleEnum.REGULAR);
                await user.updateUserOrganizationCode("LANI");
                expect(user.role).to.be.not.equal(UserModelStubs.JohnSnow.role);
                expect(user.serviceRole).to.be.not.equal(UserModelStubs.JohnSnow.serviceRole);
            });

it("should generate organization code", function() {
    const orgCode = UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(UserType.UNIVERSITY, "hello");
    expect(orgCode).to.be.not.empty;
});

it("should verify default role assignment for organization", function() {
    const role = UserModel.getDefaultUserRoleForUserType(UserType.BUSINESS);
    const serviceRole = UserModel.getDefaultServiceRoleForUser(UserType.BUSINESS);

    expect(role).to.be.equal(UniversityRoles.STAFF);
    expect(serviceRole).to.be.equal(ServiceRoleEnum.PREMIUM);
});

it("should search correct users", async () => {
    const results = await UserModel.getUserDetailsByOrganizationCodeAndRole(user.organizationCode, user.role as unknown as UniversityRoles, 0, 10,"");
    expect(results.length).to.be.equal(1);
});

it("should get all students", async () => {
    const results = await UserModel.getStudentDetailsByOrganizationCode(user.organizationCode);
    expect(results.length).to.be.equal(0);
});

it("should check successful update operations", async function() {
await user.persist();
await UserModel.updateUniversityCardsForUser(user.userId, {
    showOnboardStaffCard: false,
    showOnboardStudentsCard: false
},
{
    colorTheme: ColorThemes.BLACKWHITE,
    fontTheme: FontThemes.FONTL
}
);
await user.updateUserOrganizationCode("hi");
await UserModel.addOrganisationName("hello", user.userId);
await user.createAccountEmailVerificationRequest("hello/com");
await UserModel.updateAccessRequestStatus(user.email, true);
await user.addUserTagIfDoesNotExist("greeting");
await user.setIsContextualized(true);
await UserModel.updateUserDetail(user.userId, {context: UserCreationContext.HACKATHON});
const ct = await user.getFirstTimeContext();
});

it("should compute all student level operation", async function() {
    await UserModel.countStudentsInUniversityByUniversityCode(user.organizationCode, "");

});
});

