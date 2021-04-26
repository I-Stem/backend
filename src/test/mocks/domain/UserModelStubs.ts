import { UniversityRoles } from "../../../domain/organization/OrganizationConstants";
import { OAuthProvider, ServiceRoleEnum, UserType } from "../../../domain/user/UserConstants";
import UserModel from "../../../domain/user/User";
import {OrganizationModelStubs} from "./OrganizationModelStubs";

export const UserModelStubs = {
    JohnSnow: new UserModel({
fullname: "John Snow",
email: "john@stark.com",
organizationCode: OrganizationModelStubs.winterfellUniversity.code,
organizationName: "Starks",
userType: UserType.UNIVERSITY,
serviceRole: ServiceRoleEnum.PREMIUM,
role: UniversityRoles.STUDENT,
oauthProvider: OAuthProvider.GOOGLE
    }),

    AryaStark: new UserModel({
        fullname: "Arya Stark",
        email: "arya@stark.com",
        organizationCode: OrganizationModelStubs.winterfellUniversity.code,
        organizationName: "Starks",
        userType: UserType.UNIVERSITY,
        serviceRole: ServiceRoleEnum.PREMIUM,
        role: UniversityRoles.STUDENT,
        oauthProvider: OAuthProvider.GOOGLE
            }),
}