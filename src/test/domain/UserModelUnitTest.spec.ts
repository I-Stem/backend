import UserModel from "../../domain/user/User";
import db from "../dbHandler";
import chai, { expect } from "chai";
import { UserType, OAuthProvider } from "../../domain/user/UserConstants";
import { UniversityRoles } from "../../domain/organization";
import { ServiceRoleEnum } from "../../models/User";
import { UserCreationContext } from "../../domain/user";
const should = chai.should();

describe("Test for user model lifecycle", function () {

    before(async function() {
        await db.createConnection();
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });
            
    it("Should create a successful user", async function () {
        await UserModel.registerUser({
            email: "john@universe.world",
            fullname: "john hopkins",
            userType: UserType.I_STEM,
            role: UniversityRoles.STUDENT,
            serviceRole: ServiceRoleEnum.REGULAR,
            isVerified: true,
            organizationCode: "galaxy",
                oauthProvider: OAuthProvider.GOOGLE,
                oauthProviderId: "10^42",
                context: UserCreationContext.HACKATHON,
                isContextualized: false
        }, undefined, undefined);
    });

});

