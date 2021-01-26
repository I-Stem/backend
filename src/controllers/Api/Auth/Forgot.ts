/**
 * Define Forgot password API
 *
 */

import User from '../../../models/User';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response } from 'express';
import {MessageQueue} from '../../../queues';
import loggerFactory from '../../../middlewares/WinstonLogger';
import emailService from '../../../services/EmailService';
import UserModel from '../../../domain/user/User';
import AuthMessageTemplates from '../../../MessageTemplates/AuthTemplates';

class ForgotController {

    static servicename = 'ForgotController';

    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory(ForgotController.servicename, methodname);
        logger.info(`Forgot password triggered for ${req.body.email}`);
        const _email = req.body.email.toLowerCase();
        User.findOne({ email: _email }, (err, user) => {
            if (err) {
                logger.info('Bad Request');
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Bad request please try again.`
                    })
                );
            }
            if (!user) {
                logger.info(`${req.body.email} is not registered with us.`);
                return res.status(HttpStatus.NOT_FOUND).json(
                    response[HttpStatus.NOT_FOUND]({
                        message: `This email address is not registered with us.`
                    })
                );
            }
            const _passwordResetExpires = user.generateResetExpiryDate();
            const _passwordResetToken = user.generateResetToken(
                _passwordResetExpires
            );
            const _resetPasswordURL = `${req.body.resetPasswordURL}?resetToken=${_passwordResetToken}&email=${encodeURIComponent(_email)}`;
            user.updateOne(
                {
                    passwordResetToken: _passwordResetToken,
                    passwordResetExpires: _passwordResetExpires
                },
                (err) => {
                    if (err) {
                        logger.info('Internal server error occured in password reset.' + err);
                        return res.status(HttpStatus.BAD_GATEWAY).json(
                            response[HttpStatus.BAD_GATEWAY]({
                                message: `An internal server error occured ${err}`
                            })
                        );
                    }

                    emailService.sendEmailToUser(new UserModel(user), AuthMessageTemplates.getForgotPasswordMessage({
                        name: user.fullname,
                        verificationLink: _resetPasswordURL
                    }));
                    logger.info('Email sent to user for password reset.');
                    return res.status(HttpStatus.OK).json(
                        response[HttpStatus.OK]({
                            message: `An email has been sent to you. Visit it to reset the password`
                        })
                    );
                }
            );
        });
    }
}

export default ForgotController;
