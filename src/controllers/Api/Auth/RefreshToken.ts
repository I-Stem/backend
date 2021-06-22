/**
 * Refresh JWToken
 *
 */

import * as jwt from 'jsonwebtoken';
import Locals from '../../../providers/Locals';
import User from '../../../models/User';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response } from 'express';
import loggerFactory from '../../../middlewares/WinstonLogger';

class RefreshTokenController {

    static servicename = 'RefreshTokenController';

    public static getToken(req: Request): string {
        let methodname = 'getToken';
        let logger = loggerFactory(RefreshTokenController.servicename, methodname);

        if (
            req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'Bearer'
        ) {
            logger.info('Returning authorization token.');
            return req.headers.authorization.split(' ')[1];
        }
        logger.info('Returning empty token.');
        return '';
    }

    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory(RefreshTokenController.servicename, methodname);
        const _token = RefreshTokenController.getToken(req);
        if (_token === '') {
            logger.info('Request missing token.');
            return res.status(HttpStatus.BAD_REQUEST).json(
                response[HttpStatus.BAD_REQUEST]({
                    message: `The request is missing a required parameter`
                })
            );
        }

        const decode:any = jwt.decode(_token, res.locals.app.appSecret);

        User.findOne({ email: decode?.email.toLowerCase() }, (err, user) => {
            if (err) {
                logger.info('Bad Request');
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
                        message: `User not found`
                    })
                );
            }

            if (!user.password) {
                logger.error(`Password is required for ${req.body.email}`);
                return res.status(HttpStatus.UNAUTHORIZED).json(
                    response[HttpStatus.UNAUTHORIZED]({
                        message: `Please login using your social creds`
                    })
                );
            }

            user.comparePassword(decode?.password, (err: any, isMatch: Boolean) => {
                if (err) {
                    logger.error(`Internal server error occurred. ${err}`);
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An internal server error occured. ${err}`
                        })
                    );
                }

                if (!isMatch) {
                    logger.error(`Wrong password for ${req.body.email}`);
                    return res.status(HttpStatus.UNAUTHORIZED).json(
                        response[HttpStatus.UNAUTHORIZED]({
                            message: `Password do not match`
                        })
                    );
                }

                const token = jwt.sign(
                    { email: decode?.email, password: decode?.password },
                    res.locals.app.appSecret,
                    { expiresIn: res.locals.app.jwtExpiresIn * 60 }
                );

                // Hide protected columns
                delete user.tokens;
                delete user.password;
                logger.error(`Token for ${req.body.email} refreshed successfully.`);
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        message: `Token refreshed successfully`,
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

export default RefreshTokenController;
