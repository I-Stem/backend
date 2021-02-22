/**
 * Define Reset password API
 *
 */

import User from '../../../models/User';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response } from 'express';
import loggerFactory from '../../../middlewares/WinstonLogger';

class ResetController {
    static servicename = 'ResetController';

    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory(ResetController.servicename, methodname);

        const _email = req.body.email.toLowerCase();
        const _passwordResetToken = req.body.passwordResetToken;
        const _password = req.body.password;
        logger.info(`Resetting password for ${req.body.email}`);
        User.findOne({ email: _email }, (err, user) => {
            if (err) {
                logger.error(`Bad request error. ${err}`);
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Bad request please try again.`
                    })
                );
            }
            if (user?.passwordResetToken !== _passwordResetToken) {
                logger.error(`Incorrect password reset token.`);
                return res.status(HttpStatus.FORBIDDEN).json(
                    response[HttpStatus.FORBIDDEN]({
                        message: `Incorrect code. Please check the code`
                    })
                );
            }
            if (user && user.passwordResetExpires.getTime() < new Date().getTime()) {
                logger.error('Password reset token expired.');
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Code is expired. Please go to forget password for new code`
                    })
                );
            }

            user?.updateOne({ password: user.generatePassword(_password) }, 
            {},
            (err) => {
                if (err) {
                    logger.error(`Internal error occurred. ${err}`);
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An internal server error occured ${err}`
                        })
                    );
                }

                logger.info('Password reset successfully completed.');
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        message: `Password reset complete`
                    })
                );
            });

        });
    }
}

export default ResetController;
