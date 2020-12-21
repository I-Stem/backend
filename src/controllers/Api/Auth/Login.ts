/**
 * Define Login Login for the API
 *
 *
 */

import * as jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Locals from '../../../providers/Locals';
import { Request, Response, NextFunction } from 'express';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import loggerFactory from '../../../middlewares/WinstonLogger';
import { Http } from 'winston/lib/winston/transports';
import {packRules} from '@casl/ability/extra';
import { abilitiesforUser } from '../../../middlewares/Abilities';

class Login {
    static servicename = 'Login';

    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory.call(this, Login.servicename, methodname);

        const _email = req.body.email.toLowerCase();
        const _password = req.body.password;
        User.findOne({ email: _email })
            .select('-verifyUserToken -verifyUserExpires -passwordResetExpires -passwordResetToken')
            .exec((err, user) => {
                if (err) {
                    logger.error(err);
                    return res.status(HttpStatus.BAD_REQUEST).json(
                        response[HttpStatus.BAD_REQUEST]({
                            message: `Bad request please try again.`
                        })
                    );
                }

                if (!user) {
                    logger.error(`${req.body.email} is not registered with us.`);
                    return res.status(HttpStatus.NOT_FOUND).json(
                        response[HttpStatus.NOT_FOUND]({
                            message: `This email address is not registered with us.`
                        })
                    );
                }

                if (!user.password) {
                    logger.error(`Password is required for ${req.body.email}`);
                    return res.status(HttpStatus.UNAUTHORIZED).json(
                        response[HttpStatus.UNAUTHORIZED]({
                            message: `Password is required.`
                        })
                    );
                }

                user.comparePassword(_password, (err: any, isMatch: boolean) => {
                    let methodname = 'comparePassword';
                    let logger = loggerFactory.call(this, Login.servicename, methodname);
                    if (err) {
                        logger.error('Error occurred while comparing password. ' + err);
                        return res.status(HttpStatus.BAD_GATEWAY).json(
                            response[HttpStatus.BAD_GATEWAY]({
                                message: `An internal server error occured. ${err}`
                            })
                        );
                    }
                    if (!user.isVerified) {
                        logger.info(`User is not verified. Please verify it by clicking the link recieved on email`);
                        return res.status(HttpStatus.UNAUTHORIZED).json(
                            response[HttpStatus.UNAUTHORIZED]({
                                message: `User is not verified. Please verify User by clicking the link recieved on email.`
                            })
                        );
                    }
                    if (!isMatch) {
                        logger.error(`Wrong password for ${req.body.email}`);
                        return res.status(HttpStatus.UNAUTHORIZED).json(
                            response[HttpStatus.UNAUTHORIZED]({
                                message: `Wrong password. Try again or click Forgot password to reset it.`
                            })
                        );
                    }
                    const token = jwt.sign(
                        { email: _email, id: user.id, userType: user.userType, rules: packRules(abilitiesforUser(user.role).rules) },
                        Locals.config().appSecret,
                        { expiresIn: Locals.config().jwtExpiresIn * 60 }
                    );

                    // Hide protected columns
                    delete user.tokens;
                    delete user.password;
                    user.password = ''; // TODO: delete is not working fix that
                    logger.info(`Login Successful for ${req.body.email}`);
                    return res.status(HttpStatus.OK).json(
                        response[HttpStatus.OK]({
                            message: `Login successful`,
                            data: {
                                user,
                                token,
                                token_expires_in: Locals.config().jwtExpiresIn * 60
                            }
                        })
                    );
                });
            });
    }
}

export default Login;
