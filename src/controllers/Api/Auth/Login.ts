/**
 * Define Login Login for the API
 *
 *
 */

import * as jwt from "jsonwebtoken";
import UserModel from "../../../domain/user/User";
import { UserRoleEnum, UserType } from "../../../domain/user/UserConstants";
import Locals from "../../../providers/Locals";
import { Request, Response, NextFunction } from "express";
import { createResponse, response } from "../../../utils/response";
import * as HttpStatus from "http-status-codes";
import loggerFactory from "../../../middlewares/WinstonLogger";
import { Http } from "winston/lib/winston/transports";
import { packRules } from "@casl/ability/extra";
import { abilitiesforUser } from "../../../middlewares/Abilities";
import {OrganizationModel}  from "../../../domain/organization";
import {UniversityRoles, UniversityAccountStatus} from "../../../domain/organization/OrganizationConstants";

export const enum UniversityStatus {
    REGISTRATION_PENDING = "REGISTRATION_PENDING",
    REGISTRATION_COMPLETE = "REGISTRATION_COMPLETE",
    REGISTRATION_REJECTED = "REGISTRATION_REJECTED",
    APPROVAL_PENDING = "APPROVAL_PENDING",
}
class Login {
    static servicename = "Login";
    public static async perform(req: Request, res: Response) {
        let methodname = "perform";
        let logger = loggerFactory.call(this, Login.servicename, methodname);

        const _email = req.body.email.toLowerCase();
        const _password = req.body.password;

        try {
            const user = await UserModel.findUserByEmail(_email);

            if (!user) {
                logger.error(`${req.body.email} is not registered with us.`);
                return createResponse(
                    res,
                    HttpStatus.NOT_FOUND,
                    `This email address is not registered with us.`
                );
            }

            if (!user.isVerified) {
                logger.info(
                    `User is not verified. Please verify it by clicking the link recieved on email`
                );
                return createResponse(
                    res,
                    HttpStatus.UNAUTHORIZED,
                    `User is not verified. Please verify User by clicking the link recieved on email.`
                );
            }

            const isMatch = await user.comparePassword(_password);
            if (!isMatch) {
                logger.error(`Wrong password for ${req.body.email}`);
                return createResponse(
                    res,
                    HttpStatus.UNAUTHORIZED,
                    `Wrong password. Try again or click Forgot password to reset it.`
                );
            }

            const organizationStatus = await Login.checkIfOrganizationIsApproved(
                res,
                user
            );
            const university = await OrganizationModel.getUniversityByCode(
                    user.organizationCode
                );

            logger.info(`Login Successful for ${req.body.email}`);
            const token = Login.generateJWTTokenForUser(user);
            return createResponse(res, HttpStatus.OK, `Login successful`, {
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
                    showOnboardStudentsCard: user.showOnboardStudentsCard,
                    escalationSetting: university?.escalationHandledBy,
                    handleAccessibilityRequests:
                        university?.handleAccessibilityRequests,
                    userPreferences: user.userPreferences,
                },
                token,
                organizationStatus,
                token_expires_in: Locals.config().jwtExpiresIn * 60,
                contextPath: await user.getFirstTimeContext(),
            });
        } catch (error) {
            logger.error("Error occured: %o", error);
        }
    }

    public static async checkIfOrganizationIsApproved(
        res: Response,
        user: UserModel
    ): Promise<string> {
        const logger = loggerFactory(
            Login.servicename,
            "checkIfOrganizationIsApproved"
        );
        let organizationStatus = "";
        if (
            (user.userType == UserType.UNIVERSITY ||
                user.userType == UserType.BUSINESS) &&
            user.role == UniversityRoles.STAFF
        ) {
            try {
                const university = await OrganizationModel.getUniversityByCode(
                    user.organizationCode
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

        return organizationStatus;
        /*
        if (
            organizationStatus ===
            UniversityStatus.APPROVAL_PENDING
        )
            res.status(HttpStatus.METHOD_NOT_ALLOWED).json(
                response[HttpStatus.METHOD_NOT_ALLOWED]({
                    message: `Approval Pending for university`,
                })
            );

        if (
            organizationStatus ===
            UniversityStatus.REGISTRATION_REJECTED
        )
             res.status(HttpStatus.FORBIDDEN).json(
                response[HttpStatus.FORBIDDEN]({
                    message: `Registration rejected for university`,
                })
            );

            return organizationStatus;
            */
    }

    public static generateJWTTokenForUser(user: UserModel): string {
        const token = jwt.sign(
            {
                email: user.email,
                id: user.userId,
                userType: user.userType,
                role: user.role,
                organizationCode: user.organizationCode,
                serviceRole: user.serviceRole,
                rules: packRules(
                    abilitiesforUser(user.serviceRole, user.role).rules
                ),
            },
            Locals.config().appSecret,
            { expiresIn: Locals.config().jwtExpiresIn * 60 }
        );

        return token;
    }
}

export default Login;
