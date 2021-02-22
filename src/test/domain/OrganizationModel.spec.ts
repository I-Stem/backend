import { expect } from "chai";
import MongoServer from "../dbHandler";
import OrganizationModel from "../../domain/organization/OrganizationModel";
import UserModel from "../../domain/user/User";
import { OAuthProvider, UserType } from "../../domain/user/UserConstants";
import { ServiceRoleEnum } from "../../models/User";

describe("Unit tests for organization flow", () => {
    const organizationName = "I-Stem";
    const organizationCode =
        organizationName.toUpperCase().replace(/\s/g, "_") +
        "_" +
        new Date().getTime();
    let user: UserModel | null;
    before(async () => {
        await MongoServer.createConnection();
        user = await new UserModel({
            email: "suman@inclusivestem.org",
            fullname: "Suman Kumar",
            oauthProvider: OAuthProvider.PASSWORD,
            organizationCode: organizationCode,
            serviceRole: ServiceRoleEnum.REGULAR,
            userType: UserType.I_STEM,
        }).persist();
        expect(user?.fullname).equal("Suman Kumar");
    });

    it("creates a new university", async () => {
        const organizationName = "I-Stem";
        const org = new OrganizationModel({
            code: organizationCode,
            name: organizationName,
        });
        console.log(user);
        await org.persistUniversity(user?.userId || "");
    });

    after(async () => {
        await MongoServer.cleanup();
        await MongoServer.closeConnection();
    });

});
