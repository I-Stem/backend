import { Request, Response } from "express";
import { createResponse, response } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import loggerFactory from "../../middlewares/WinstonLogger";
import { UserType, UserRoleEnum } from "../../domain/user/UserConstants";
import {OrganizationModel}  from "../../domain/organization";
import {UniversityRoles, UniversityAccountStatus} from "../../domain/organization/OrganizationConstants";
import { UniversityStatus } from "./Auth/Login";
import UserModel from "../../domain/user/User";

class UserInfo {
    static servicename = "UserInfo";
    public static async userDetails(req: Request, res: Response): Promise<any> {
        const methodname = "userDetails";
        const logger = loggerFactory.call(
            this,
            UserInfo.servicename,
            methodname
        );
        let organizationStatus = "";

        try {
            const promises = await Promise.all([
                UserModel.findUserByEmail(res.locals.user.email),
                OrganizationModel.getUniversityByCode(res.locals.user.organizationCode)
            ]);
        const user = promises[0];
        const university = promises[1];

        if (
            user?.userType == UserType.UNIVERSITY &&
            user?.role == UniversityRoles.STAFF
        ) {
                if (
                    university.accountStatus ===
                    UniversityAccountStatus.APPROVED
                ) {
                    if (university.address == "") {
                        organizationStatus =
                            UniversityStatus.REGISTRATION_PENDING;
                    } else {
                        organizationStatus =
                            UniversityStatus.REGISTRATION_COMPLETE;
                    }
                } else if (
                    university.accountStatus ===
                    UniversityAccountStatus.REJECTED
                ) {
                    organizationStatus = UniversityStatus.REGISTRATION_REJECTED;
                } else {
                    organizationStatus = UniversityStatus.APPROVAL_PENDING;
                }
        }

        if (user !== null) {
            const contextPath = await user.getFirstTimeContext();
            return createResponse(res, HttpStatus.OK, `User details`, {
                        user: {
                            email: user.email,
                            fullname: user.fullname,
                            id: user.userId,
                            _id: user.userId,
                            role: user.role,
                            serviceRole: user.serviceRole,
                            organizationCode: user.organizationCode,
                            userType: user.userType,
                            escalationSetting: university?.escalationHandledBy,
                            handleAccessibilityRequests:
                                university?.handleAccessibilityRequests,
                            userPreferences: user.userPreferences,
                        },
                        organizationStatus,
                        contextPath,
                    },
                );

        } else
            return createResponse(res, HttpStatus.NOT_FOUND, "user not found");
        } catch (err) {
            logger.error("Error occured: %o", err);
            return createResponse(res, HttpStatus.BAD_GATEWAY, "error in getting user details");
        }

    }
}
export default UserInfo;
