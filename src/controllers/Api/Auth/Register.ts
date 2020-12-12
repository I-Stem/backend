/**
 * Define the Register API logic
 *
 */

import { createResponse, response } from "../../../utils/response";
import * as HttpStatus from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import loggerFactory from "../../../middlewares/WinstonLogger";
import emailService from "../../../services/EmailService";
import UserModel, { UserType } from "../../../domain/User";
import AuthMessageTemplates from "../../../MessageTemplates/AuthTemplates";
import InvitedUserModel, {
    InvitedUserEnum,
} from "../../../domain/InvitedUserModel";
import LedgerModel from "../../../domain/LedgerModel";
import Locals from "../../../providers/Locals";
import UniversityModel, {
    UniversityRoles,
} from "../../../domain/UniversityModel";

class RegisterController {
    static servicename = "RegisterController";
    public static async perform(req: Request, res: Response) {
        let methodname = "perform";
        let logger = loggerFactory(RegisterController.servicename, methodname);

        const _email: string = req.body.email.toLowerCase();
        const _password = req.body.password;

        const user = new UserModel({
            email: _email,
            password: _password,
            userType: req.body.userType,
            role: UserModel.getDefaultUserRoleForUserType(req.body.userType),
            organizationName: req.body.organizationName,
            organizationCode: UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(
                req.body.userType,
                req.body.organizationName
            ),
            serviceRole: UserModel.getDefaultServiceRoleForUser(req.body.userType),
            fullname: req.body.fullname,
        });

        try {
            const existingUser = await UserModel.findUserByEmail(_email);

            if (existingUser) {
                logger.error(`Existing account - ${existingUser.email}`);
                return createResponse(
                    res,
                    HttpStatus.CONFLICT,
                    `Account already exists. Please sign in to your account.`
                );
            }

            const persistedUser = await user.persist();
            const domainName = _email.split("@")[1];
            const university = await UniversityModel.findUniversityByDomainName(
                domainName
            );
            logger.info(`University: ${JSON.stringify(university)}`);
            if (!persistedUser) {
                return createResponse(
                    res,
                    HttpStatus.BAD_GATEWAY,
                    "couldn't store user information"
                );
            }

            if (university !== null) {
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
                    try {
                        const invitedUserData = await InvitedUserModel.getInvitedUserByEmail(
                            _email
                        );
                        if (invitedUserData) {
                            if (
                                invitedUserData.role == UniversityRoles.STUDENT
                            ) {
                                persistedUser?.changeUserRole(
                                    UniversityRoles.STUDENT
                                );
                            } else {
                                persistedUser.changeUserRole(
                                    UniversityRoles.STAFF
                                );
                            }
                            persistedUser.updateUserOrganizationCode(
                                invitedUserData.university
                            );
                            persistedUser.updateVerificationStatus(true);
                        }
                    } catch (err) {
                        logger.error("Error occured: %o", err);
                    }

                    LedgerModel.createCreditTransaction(
                        persistedUser.userId,
                        Locals.config().invitedUserCredits,
                        "Successful verification"
                    );
                } else {
                    logger.error(`Invalid email or verification token,`);
                    return createResponse(
                        res,
                        HttpStatus.CONFLICT,
                        `Invalid email or verification token. Try again with the link.`
                    );
                }
            } else {
                const _verificationLink = `${
                    req.body.verificationLink
                }?verifyToken=${
                    persistedUser?.verifyUserToken
                }&email=${encodeURIComponent(_email)}`;

                emailService.sendEmailToUser(
                    user,
                    AuthMessageTemplates.getAccountEmailVerificationMessage({
                        name: persistedUser.fullname,
                        verificationLink: _verificationLink,
                    })
                );

                if (
                    persistedUser.userType === UserType.BUSINESS ||
                    persistedUser.userType === UserType.UNIVERSITY
                ) {
                    logger.info(
                        `got an organization request for organization name: ${persistedUser.organizationName}`
                    );
                    emailService.notifyIStemTeam(
                        AuthMessageTemplates.getNewOrganizationRegistrationRequestMessage(
                            {
                                firstUser: persistedUser,
                                approvalLink: `${process.env.APP_URL}/api/university/organ/req/${persistedUser.organizationCode}/approve`,
                                rejectionLink: `${process.env.APP_URL}/api/university/organ/req/${persistedUser.organizationCode}/reject`,
                            }
                        )
                    );

                    const organization = new UniversityModel({
                        code: persistedUser.organizationCode,
                        name: persistedUser.organizationName || "",
                        registeredByUser: persistedUser.userId,
                    });

                    await organization.persistUniversity(persistedUser.userId);
                }
            }
        } catch (err) {
            logger.error("Bad Request: %o", err);
            return createResponse(
                res,
                HttpStatus.BAD_GATEWAY,
                `Bad request please try again.`
            );
        }

        logger.info(`Successfully registered ${req.body.email}`);
        return createResponse(
            res,
            HttpStatus.OK,
            `You have been successfully registered with us!`
        );
    }
}

export default RegisterController;
