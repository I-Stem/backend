import User from "../../models/User";
import { Request, Response } from "express";
import { createResponse, response } from "../../utils/response";
import * as HttpStatus from "http-status-codes";
import loggerFactory from "../../middlewares/WinstonLogger";
import { UserType } from "../../domain/user";
import UniversityModel, {
    UniversityAccountStatus,
    UniversityRoles,
} from "../../domain/UniversityModel";
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
        const user = await UserModel.findUserByEmail(res.locals.user.email);
        
        if (
            user?.userType == UserType.UNIVERSITY &&
            user?.role == UniversityRoles.STAFF
        ) {
            try {
                const university = await UniversityModel.getUniversityByCode(
                    user?.organizationCode
                );
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
            } catch (err) {
                logger.error("Error occured: %o", err);
            }
        }

        if(user !== null) 
        return res.status(HttpStatus.OK).json(
            response[HttpStatus.OK]({
                message: `User details`,
                data: {
                    user: {
                        email: user.email,
                        fullname: user.fullname,
                        id: user.userId,
                        _id: user.userId,
                        role: user.role,
                        serviceRole: user.serviceRole,
                        organizationCode: user.organizationCode,
                        userType: user.userType,
                        showOnboardStaffCard: user.showOnboardStaffCard,
                        showOnboardStudentsCard: user.showOnboardStudentsCard
                    },
                                        organizationStatus,
                },
            })
        );
else
return createResponse(res, HttpStatus.NOT_FOUND, "user not found");
    }
}
export default UserInfo;