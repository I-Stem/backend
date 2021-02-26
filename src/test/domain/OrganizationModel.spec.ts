import { expect } from "chai";
import db from "../dbHandler";
import OrganizationModel, {
    University,
} from "../../domain/organization/OrganizationModel";
import UserModel from "../../domain/user/User";
import { OAuthProvider, UserType } from "../../domain/user/UserConstants";
import { ServiceRoleEnum } from "../../models/User";
import { UniversityAccountStatus } from "../../domain/organization";

describe("Unit tests for organization flow", () => {
    const organizationName = "I-Stem";
    const organizationCode =
        organizationName.toUpperCase().replace(/\s/g, "_") +
        "_" +
        new Date().getTime();
    let user: UserModel | null;
    let org: OrganizationModel | null;
    before(async () => {
        await db.createConnection();
        user = await new UserModel({
            email: "user@inclusivestem.org",
            fullname: "John Doe",
            oauthProvider: OAuthProvider.PASSWORD,
            organizationCode: organizationCode,
            serviceRole: ServiceRoleEnum.REGULAR,
            userType: UserType.I_STEM,
        }).persist();
        expect(user?.fullname).equal("John Doe");
    });

    it("should create a new organization", async function () {
        const organizationName = "I-Stem";
        await new OrganizationModel({
            code: organizationCode,
            name: organizationName,
        }).persistUniversity(user?.userId || "");
    });
    describe("university model", function () {
        it("should return university model by university code", async function () {
            org = await OrganizationModel.getUniversityByCode(organizationCode);
        });
        it("should change account status to APPROVED", async function () {
            await org.changeAccountStatusTo(UniversityAccountStatus.APPROVED);
        });
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
