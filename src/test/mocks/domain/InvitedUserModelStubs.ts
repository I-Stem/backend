import { UniversityRoles } from "../../../domain/organization/OrganizationConstants";
import { UserType } from "../../../domain/user/UserConstants";
import {InvitedUserModel} from "../../../domain/InvitedUserModel";
import {OrganizationModelStubs} from "./OrganizationModelStubs";

export const InvitedUserModelStubs = {
    sansa: new InvitedUserModel({
fullName: "Sansa Stark",
email: "sansa@stark.com",
userType: UserType.UNIVERSITY,
role: UniversityRoles.STUDENT,
university: OrganizationModelStubs.winterfellUniversity.code,
    })
}