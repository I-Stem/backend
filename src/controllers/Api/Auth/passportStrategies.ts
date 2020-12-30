import User, { ServiceRoleEnum, UserRoleEnum } from "../../../models/User";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import UserModel, { OAuthProvider, UserType } from "../../../domain/user/User";
import loggerFactory from "../../../middlewares/WinstonLogger";
import LedgerModel from "../../../domain/LedgerModel";
import Locals from "../../../providers/Locals";
import emailService from "../../../services/EmailService";
import AuthMessageTemplates from "../../../MessageTemplates/AuthTemplates";
import UniversityModel, {
    UniversityRoles,
} from "../../../domain/UniversityModel";
import { InvitationEmailMismatchError, NoSuchUserError } from "../../../domain/user/UserDomainErrors";

class GoogleLogin {
    static servicename = "GoogleLogin";
    public static googleOAuth(): any {
        const methodname = "googleOAuth";
        const logger = loggerFactory(GoogleLogin.servicename, methodname);
        passport.use(
            new GoogleStrategy.Strategy(
                {
                    clientID: process.env.GOOGLE_ID || "",
                    clientSecret: process.env.GOOGLE_SECRET || "",
                    callbackURL: `${process.env.APP_URL}/api/auth/google/redirect`,
                    proxy: true,
                    passReqToCallback:true
                },
                async (req, token, refreshToken, profile, done) => {
                    logger.info("request cookies by parser in strategy callback: %o", req.cookies);
                    logger.info("raw request cookies in callback: %o", req.headers.cookie)

                    if(req.cookies.invitationEmail || req.cookies.invitationToken) {
                        if( req.cookies.invitationEmail?.toLowerCase()
                        !==
                        profile._json.email.toString().toLowerCase()) {
                        done(new InvitationEmailMismatchError("Invitation email: " + req.cookies.invitationEmail + " doesn't match with provided email: " + profile._json.email), undefined);
                        return;
                        }
                    }
                    const user = await UserModel.findUserByEmail(profile._json.email);
                    if (user) {
                        done(undefined, user);
                    } else if(req.cookies.liprodAuthFlow ?.toLowerCase() === "login") {
   logger.info("trying to signin with nonexisting email: " + profile._json.email);
   done(new NoSuchUserError(`No account exist with provided email id: ${profile._json.email}, Please create an account first.`), undefined);
                    }
                    else {
                        try {
                        const newUser = await UserModel.registerUser({
                            email: profile._json.email,
                            fullname: profile.displayName,
                            userType: req.cookies.userType,
                            role: UserModel.getDefaultUserRoleForUserType(req.cookies.userType),
                            serviceRole: UserModel.getDefaultServiceRoleForUser(req.cookies.userType),
                            isVerified: true,
                            organizationCode: UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(
                                req.cookies.userType,
                                profile.displayName,
                                ),
                                oauthProvider: OAuthProvider.GOOGLE,
                                oauthProviderId: profile.id
                        },
                        req.cookies.invitationToken, undefined);

                                done(undefined, newUser ? newUser : undefined);
                        } catch (error) {
                            logger.error("Bad Request: %o", error);
                            done(error, undefined);
                        }
                        logger.info(
                            `Successfully registered ${profile._json.email}`
                        );

                    }

                }
            )
        );

    }
}
export default GoogleLogin;
