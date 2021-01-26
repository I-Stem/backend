/**
 * Define the Register API logic
 *
 */

import { createResponse, response } from "../../../utils/response";
import * as HttpStatus from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import loggerFactory from "../../../middlewares/WinstonLogger";
import emailService from "../../../services/EmailService";
import UserModel, { OAuthProvider, UserType } from "../../../domain/user/User";
import AuthMessageTemplates from "../../../MessageTemplates/AuthTemplates";
import InvitedUserModel, {
    InvitedUserEnum,
} from "../../../domain/InvitedUserModel";
import LedgerModel from "../../../domain/LedgerModel";
import Locals from "../../../providers/Locals";
import UniversityModel, {
    UniversityRoles,
} from "../../../domain/organization/OrganizationModel";
import { UserDomainErrors } from "../../../domain/user/UserDomainErrors";
import passport from "passport";
import Login from "./Login";

class RegisterController {
    static servicename = "RegisterController";
    public static async perform(req: Request, res: Response) {
        let methodname = "perform";
        let logger = loggerFactory(RegisterController.servicename, methodname);

        const _email: string = req.body.email.toLowerCase();
        const _password = req.body.password;

        try {
            const user = await UserModel.registerUser(
                {
                    email: _email,
                    password: _password,
                    userType: req.body.userType,
                    role: UserModel.getDefaultUserRoleForUserType(
                        req.body.userType
                    ),
                    organizationName: req.body.organizationName,
                    organizationCode: UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(
                        req.body.userType,
                        req.body.organizationName
                    ),
                    serviceRole: UserModel.getDefaultServiceRoleForUser(
                        req.body.userType
                    ),
                    fullname: req.body.fullname,
                    oauthProvider: OAuthProvider.PASSWORD,
                    context: req.body.context,
                },
                req.body.verifyToken,
                req.body.verificationLink
            );
            logger.info(`University: ${JSON.stringify(university)}`);
            if (!persistedUser) {
                return createResponse(
                    res,
                    HttpStatus.BAD_GATEWAY,
                    "couldn't store user information"
                );
            }
            if (university !== null && persistedUser.role === UniversityRoles.STUDENT) {
                logger.info(`Updating user details for university student`);
                UserModel.updateUserDetail(persistedUser.userId, {
                    organizationCode: university.code,
                    userType: UserType.UNIVERSITY,
                    role: UniversityRoles.STUDENT,
                    organizationName: university.name,
                });
                logger.info(`${JSON.stringify(user)}, ${persistedUser.userId}`);
            }

            if (req.body.verifyToken) {
                const isUserValid = await InvitedUserModel.checkInvitedUser(
                    _email,
                    req.body.verifyToken
                );
                if (isUserValid) {
                    logger.info(`Adding invited user`);
                    InvitedUserModel.updateStatus(
                        _email,
                        InvitedUserEnum.REGISTERED
                    );
                    break;

                case UserDomainErrors.UserInfoSaveError:
                    return createResponse(
                        res,
                        HttpStatus.BAD_GATEWAY,
                        "couldn't save user info"
                    );
                    break;

                case UserDomainErrors.InvalidInvitationTokenError:
                    return createResponse(
                        res,
                        HttpStatus.CONFLICT,
                        `Invalid email or verification token. Try again with the link.`
                    );
                    break;

                default:
                    return createResponse(
                        res,
                        HttpStatus.BAD_GATEWAY,
                        `Bad request please try again.`
                    );
            }
        }

        logger.info(`Successfully registered ${req.body.email}`);
        return createResponse(
            res,
            HttpStatus.OK,
            `You have been successfully registered with us!`
        );
    }

    public static async handleLoginOrRegistrationByOAuth(res: Response) {
        const logger = loggerFactory(
            RegisterController.servicename,
            "handleLoginOrRegistrationByOauth"
        );
        try {
            return (error, user) => {
                try {
                    const logger = loggerFactory(
                        "AuthRouter",
                        "googleRedirectCallback"
                    );

                    if (error) {
                        throw error;
                    }

                    const token = Login.generateJWTTokenForUser(user);
                    res.redirect(
                        `${process.env.PORTAL_URL}/login/googleLogin?token=` +
                            token
                    );
                } catch (error) {
                    logger.error("error: %o", error);
                    switch (error.name) {
                        case UserDomainErrors.InvitationEmailMismatchError:
                            res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    error.message
                                )}`
                            );
                            break;

                        case UserDomainErrors.UserAlreadyRegisteredError:
                            return res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    error.message
                                )}`
                            );
                            break;

                        case UserDomainErrors.UserInfoSaveError:
                            return res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    error.message
                                )}`
                            );
                            break;

                        case UserDomainErrors.InvalidInvitationTokenError:
                            return res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    error.message
                                )}`
                            );
                            break;

                        case UserDomainErrors.NoSuchUserError:
                            return res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    error.message
                                )}`
                            );
                            break;

                        default:
                            res.redirect(
                                `${
                                    process.env.PORTAL_URL
                                }/login/googleLogin?message=${encodeURIComponent(
                                    "unknown error"
                                )}`
                            );
                    }
                }
            };
        } catch (error) {
            logger.error("error: " + error.name);
        }
    }
}

export default RegisterController;
