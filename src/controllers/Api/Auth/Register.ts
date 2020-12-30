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
} from "../../../domain/UniversityModel";
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
        const user = await UserModel.registerUser({
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
            oauthProvider: OAuthProvider.PASSWORD
        }, req.body.verifyToken, req.body.verificationLink);
        } catch (error) {
            logger.error("Bad Request: %o", error);
            switch(error.name) {
                case UserDomainErrors.UserAlreadyRegisteredError:
                    return createResponse(
                        res,
                        HttpStatus.CONFLICT,
                        `Account already exists. Please sign in to your account.`
                    );
    break;

    case UserDomainErrors.UserInfoSaveError:
        return createResponse(res, HttpStatus.BAD_GATEWAY, "couldn't save user info");
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

    public static async handleLoginOrRegistrationByOAuth(req:Request, res:Response, oauthProvider:string) {
        const logger = loggerFactory(RegisterController.servicename, "handleLoginOrRegistrationByOauth");
        try {
            passport.authenticate(
                oauthProvider,
                {
                    failureRedirect: `${process.env.PORTAL_URL}/login`,
                    session: false,
                },
                (error, user) => {
                    try {
                    const logger = loggerFactory("AuthRouter", "googleRedirectCallback");
                    if(error) {
                       throw error;
                    }
        


                    const token = Login.generateJWTTokenForUser(user);
                    res.redirect(
                        `${process.env.PORTAL_URL}/login/googleLogin?token=` + token
                    );

                    } catch(error) {
                        logger.error("error: " + error.name);
switch(error.name) {
    case UserDomainErrors.InvitationEmailMismatchError:
        res.redirect(
            `${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent(error.message)}`
        );
break;

case UserDomainErrors.UserAlreadyRegisteredError:
    return res.redirect(
        `${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent(error.message)}`
    );
break;

case UserDomainErrors.UserInfoSaveError:
return res.redirect(`${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent(error.message)}`);
break;

case UserDomainErrors.InvalidInvitationTokenError:
return res.redirect(`${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent(error.message)}`);
break;

case UserDomainErrors.NoSuchUserError:
return res.redirect(`${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent(error.message)}`);
break;

        default:
            res.redirect(
                `${process.env.PORTAL_URL}/login/googleLogin?message=${encodeURIComponent("unknown error")}`
            );
    }
                    }
                }
            )(req, res);
            
        
        } catch(error) {
            logger.error("error: " + error.name);

        }
    }
}

export default RegisterController;
