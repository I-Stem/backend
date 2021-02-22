import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import UserModel, { getUserTypeFromString} from "../../../domain/user/User";
import {OAuthProvider, UserType } from "../../../domain/user/UserConstants";
import loggerFactory from "../../../middlewares/WinstonLogger";
import { InvitationEmailMismatchError, NoSuchUserError } from "../../../domain/user/UserDomainErrors";
import {Request} from "express";

class PassportStrategies {
    static servicename = "PassportStrategies";
    public static getGoogleStrategy() {
        const logger = loggerFactory(PassportStrategies.servicename, "getGoogleStrategy");

            return new GoogleStrategy.Strategy(
                {
                    clientID: process.env.GOOGLE_ID || "",
                    clientSecret: process.env.GOOGLE_SECRET || "",
                    callbackURL: `${process.env.APP_URL}/api/auth/google/redirect`,
                    scope: ["profile", "email"],
                    passReqToCallback:true
                },
                async (req, token, refreshToken, profile, done) => {
logger.info("query string param in strategy: %o", req?.query);

const userData = JSON.parse(Buffer.from(req.query.state?.toString() || "", "base64").toString("ascii"));
                    if(userData.invitationEmail || userData.invitationToken) {
                        if( userData.invitationEmail?.toLowerCase()
                        !==
                        profile._json.email.toString().toLowerCase()) {
                        done(new InvitationEmailMismatchError("Invitation email: " + userData.invitationEmail + " doesn't match with provided email: " + profile._json.email), undefined);
                        return;
                        }
                    }

                    const user = await UserModel.findUserByEmail(profile._json.email);
                    if (user) {
                        logger.info("user found with: " + user.email);
                        done(undefined, user);
                    } else if(userData.authFlow?.toString()?.toLowerCase() === "login") {
   logger.info("trying to signin with nonexisting email: " + profile._json.email);
   done(new NoSuchUserError(`No account exist with provided email id: ${profile._json.email}, Please create an account first.`), undefined);
                    }
                    else {
                        try {
                            const userType = getUserTypeFromString(userData.userType);
                        const newUser = await UserModel.registerUser({
                            email: profile._json.email,
                            fullname: profile.displayName,
                            userType: userType,
                            role: UserModel.getDefaultUserRoleForUserType(userType),
                            serviceRole: UserModel.getDefaultServiceRoleForUser(userType),
                            isVerified: true,
                            organizationCode: UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(
                                userType,
                                profile.displayName,
                                ),
                                oauthProvider: OAuthProvider.GOOGLE,
                                oauthProviderId: profile.id,
                                context: userData.context,
                                isContextualized: false
                        },
                        userData.invitationToken?.toString(), undefined);

                        logger.info(                            `Successfully registered ${profile._json.email}`);
                                done(undefined, newUser ? newUser : undefined);
                        } catch (error) {
                            logger.error("Bad Request: %o", error);
                            done(error, undefined);
                        }

                    }

                }
            )


    }
}
export default PassportStrategies;
