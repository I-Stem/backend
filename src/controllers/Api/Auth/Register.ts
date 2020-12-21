/**
 * Define the Register API logic
 *
 */

import User from '../../../models/User';
import { response } from '../../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import {MessageQueue} from '../../../queues';
import loggerFactory from '../../../middlewares/WinstonLogger';
import emailService from '../../../services/EmailService';
import UserModel from '../../../domain/User';
import AuthMessageTemplates from '../../../MessageTemplates/AuthTemplates';

class RegisterController {

    static servicename = 'RegisterController';
    public static perform(req: Request, res: Response): any {
        let methodname = 'perform';
        let logger = loggerFactory(RegisterController.servicename, methodname);

        const _email = req.body.email.toLowerCase();
        const _password = req.body.password;

        const user = new User({
            email: _email,
            password: _password,
            userType: req.body.userType,
            organisationName: req.body.organisationName,
            organisationAddress: req.body.organisationAddress,
            noStudentsWithDisability: req.body.noStudentsWithDisability,
            fullname: req.body.fullname
        });

        User.findOne({ email: _email }, (err, existingUser) => {
            if (err) {
                logger.error(`Bad Request: ${err}`);
                return res.status(HttpStatus.BAD_REQUEST).json(
                    response[HttpStatus.BAD_REQUEST]({
                        message: `Bad request please try again.`
                    })
                );
            }
            if (existingUser) {
                logger.error(`Existing account - ${existingUser.email}`);
                return res.status(HttpStatus.CONFLICT).json(
                    response[HttpStatus.CONFLICT]({
                        message: `Account already exists. Please sign in to your account.`
                    })
                );
            }
            user.save(async (err) => {
                if (err) {
                    logger.error(`Could not save user information for ${req.body.email}`);
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An error occured while saving the user information.`
                        })
                    );
                }
                const _verificationLink = `${req.body.verificationLink}?verifyToken=${user?.verifyUserToken}&email=${encodeURIComponent(_email)}`;

                const userData = await UserModel.getUserById(user._id);
                if (userData !== null) {
                emailService.sendEmailToUser(userData, AuthMessageTemplates.getAccountEmailVerificationMessage({
                    name: user.fullname,
                    verificationLink: _verificationLink
                }));
            }
                logger.info(`Successfully registered ${req.body.email}`);
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        message: `You have been successfully registered with us!`
                    })
                );
            });
        });
    }
}

export default RegisterController;
