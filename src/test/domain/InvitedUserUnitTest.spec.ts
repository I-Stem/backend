import { InvitedUserModel } from "../../domain/InvitedUserModel";
import { UniversityRoles } from "../../domain/organization";
import { UserType } from "../../domain/user/UserConstants";
import db from "../dbHandler";

describe("Unit Tests for Invited User Model", function () {
    const organizationName = "I-Stem";
    const organizationCode =
        organizationName.toUpperCase().replace(/\s/g, "_") +
        "_" +
        new Date().getTime();
    before(async () => {
        await db.createConnection();
    });
    it("should create a new student invited by university", async function () {
        await InvitedUserModel.persistInvitedUser([
            {
                email: "suman@inclusivestem.org",
                role: UniversityRoles.STUDENT,
                university: organizationCode,
                userType: UserType.UNIVERSITY,
            },
        ]);
    });
    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
