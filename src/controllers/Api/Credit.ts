/**
 * Define Credits API
 *
 */
import User, { IUserModel } from '../../models/User';
import { response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import { Request, Response } from 'express';
import Ledger from '../../models/Ledger';
import loggerFactory from '../../middlewares/WinstonLogger';
import { database } from 'faker';

class Credit {
    static servicename = 'Credit';

    public static perform(req: Request, res: Response): any {
        const methodname = 'perform';
        const logger = loggerFactory(Credit.servicename, methodname);

        const loggedInUser = res.locals.user;

        User.findOne({ email: loggedInUser.email }, (err: Error, user: IUserModel) => {
            if (err) {
                logger.error(`Internal error occurred. ${err}`);
                return res.status(HttpStatus.BAD_GATEWAY).json(
                    response[HttpStatus.BAD_GATEWAY]({
                        message: `An internal server error occured. ${err}`
                    })
                );
            }
            const resultsPerPage = 20;
            const page = parseInt(req.query.page as string || '1');
            Ledger.find({ userId: user._id })
                .sort({ updatedAt: -1 })
                .limit(resultsPerPage)
                .skip(resultsPerPage * (page - 1))
                .exec()
                .then((results: any) => {
                    user?.getCredits().then((totalCredits: number) => {
                        logger.info(`Total Credits: ${totalCredits}`);
                        return res.status(HttpStatus.OK).json(
                            response[HttpStatus.OK]({
                                message: `Result of credit call`,
                                data: {
                                    totalCredits: totalCredits,
                                    transactions: results
                                }
                            })
                        );
                    }).catch((err: Error) => {
                        logger.error(`Internal error occurred. ${err}`);
                        return res.status(HttpStatus.BAD_GATEWAY).json(
                            response[HttpStatus.BAD_GATEWAY]({
                                message: `An internal server error occured. ${err}`
                            })
                        );
                    });
                }).catch((err: Error) => {
                    logger.error(`Internal error occurred. ${err}`);
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An internal server error occured. ${err}`
                        })
                    );
                });
        });
    }
    public static count(req: Request, res: Response): any {
        const methodname = 'count';
        const logger = loggerFactory(Credit.servicename, methodname);

        const loggedInUser = res.locals.user;
        User.findOne({ email: loggedInUser.email }, (err: Error, user: IUserModel) => {
            if (err) {
                logger.error(`Internal error occurred. ${err}`);
                return res.status(HttpStatus.BAD_GATEWAY).json(
                    response[HttpStatus.BAD_GATEWAY]({
                        message: `An internal server error occured. ${err}`
                    })
                );
            }
            user?.getCredits().then((totalCredits: number) => {
                logger.info(`Total Credits: ${totalCredits}`);
                if (totalCredits > 0) {
                    return res.status(HttpStatus.OK).json(
                        response[HttpStatus.OK]({
                            message: `Result of credit call`,
                            data: {
                                totalCredits: totalCredits
                            }
                        })
                    );
                } else {
                    logger.error('User does not have enough credits.');
                    return res.status(HttpStatus.PAYMENT_REQUIRED);
                }
            }).catch((err: Error) => {
                logger.error(`Internal error occurred. ${err}`);
                return res.status(HttpStatus.BAD_GATEWAY).json(
                    response[HttpStatus.BAD_GATEWAY]({
                        message: `An internal server error occured. ${err}`
                    })
                );
            });

        });
    }
}
export default Credit;
