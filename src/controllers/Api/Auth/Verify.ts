/**
 * Define Verify User API
 *
 */

import User from "../../../models/User";
import { ServiceRoleEnum, UserRoleEnum } from '../../../domain/user/UserConstants';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response } from 'express';
import loggerFactory from '../../../middlewares/WinstonLogger';
import Locals from '../../../providers/Locals';
import UserModel from '../../../domain/user/User';

class VerifyController {
    static servicename = 'VerifyController';

    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory(VerifyController.servicename, methodname);

        const _email = req.body.email.toLowerCase();
        logger.info(`Verifying user ${req.body.email}`);
        User.findOne({ email: _email }, (err, user) => {
            if (err) {
                logger.error(`Bad Request. ${err}`);
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Bad request please try again.`
                    })
                );
            }
            if (!user) {
                logger.error(`Verification time expired for ${req.body.email}`);
                return res.status(HttpStatus.FORBIDDEN).json(
                    response[HttpStatus.FORBIDDEN]({
                        message: `Your verification time has expired`
                    })
                );
            }
            const _verifyUserToken = req.body.verifyUserToken;
            if (_verifyUserToken !== user.verifyUserToken) {
                logger.error('Invalid Token.');
                return res.status(HttpStatus.FORBIDDEN).json(
                    response[HttpStatus.FORBIDDEN]({
                        message: `Invalid Token please try again`
                    })
                );
            }
            if (user.verifyUserExpires.getTime() < new Date().getTime()) {
                logger.error(`Token expired for ${req.body.email}`);
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Token has expired`
                    })
                );
            }
            if ( user.isVerified) {
                /*
                Issue-----------------------User already verified----------------------------
                Returning status 200 if user is already verified
                Ideally this situation should not arrive because user needs to be verified only once
                */
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        message: `You have been successfully verified`
                    })
                );
            }

            user?.updateOne({isVerified: true}, {}, async (err) => {
                if (err) {
                    logger.error(`Internal error occurred. ${err}`);
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An internal server error occured ${err}`
                        })
                    );
                }
                const userEmails = Locals.config().userEmails;
                if (userEmails)
                    {
                    const allEmails: string[] = Locals.config().userEmails.split(',');
                    if (allEmails.some((email) => email === user.email)) {
                        const userInstance = await UserModel.getUserByEmail(user.email);
                        userInstance?.changeUserServiceRole( ServiceRoleEnum.PREMIUM);
                        logger.info(`User Role upgrade for special users`);
                    }
                }
                logger.info('User successfully verified.');
                if (process.env.USER_ONBOARDING_CREDITS?.length === 0) {
                    logger.error(`Could not get the number of credits to add for the user ${user.email}`);
                    user.addCredits(-1, 'Successful verification. Could not credit the account successfully.');
                    return res.status(HttpStatus.OK).json(
                        response[HttpStatus.OK]({
                            message: `You have been successfully verified. The account has not been credited. Please contact us for more information.`
                        })
                    );
                } else {
                    user.addCredits(Number(process.env.USER_ONBOARDING_CREDITS), 'Successful verification');
                    logger.info(`${process.env.USER_ONBOARDING_CREDITS} credits added on successful verification`);
                    return res.status(HttpStatus.OK).json(
                        response[HttpStatus.OK]({
                            message: `You have been successfully verified`
                        })
                    );
                }

            });

        });
    }
}

export default VerifyController;
