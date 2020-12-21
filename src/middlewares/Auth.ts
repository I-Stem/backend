/**
 * Checks for authorisation header
 *
 */

import * as jwt from 'jsonwebtoken';
import Locals from '../providers/Locals';
import { Request, Response, Application, NextFunction } from 'express';
import { response } from '../utils/response';
import * as HttpStatus from 'http-status-codes';
import loggerFactory from './WinstonLogger';

class Auth {

    static servicename = 'Auth';

    public static ACCESS_TOKEN_MISSING_ERROR_MESSAGE: string = `The request is missing access token`;
    public static ACCESS_TOKEN_EXPIRED_ERROR_MESSAGE: string = `The access token has expired`;

private static AUTH_NOT_REQUIRED_ENDPOINTS = process.env.EXEMPT_ENDPOINT?.split(',') || [];


public static verifyToken(req: Request, res: Response, next: NextFunction)  {
    let logger = loggerFactory(Auth.servicename, 'verifyToken');
    if (Auth.AUTH_NOT_REQUIRED_ENDPOINTS.some(endpoint => req.path.includes(endpoint) )) {
                logger.info('Request authorization skipped for the requested endpoint ' + req.path);
                return next();
            }

    const _token = Auth.getToken(req);
    if (_token === '') {
                logger.info('Request is missing access token');
                return res.status(HttpStatus.UNAUTHORIZED).json(
                    response[HttpStatus.UNAUTHORIZED]({
                        message: Auth.ACCESS_TOKEN_MISSING_ERROR_MESSAGE
                    })
                );
            }
    jwt.verify(_token, Locals.config().appSecret, function(err: any, decoded: any) {
                if (err) {
                    switch (err.name) {
                        case 'TokenExpiredError':
                    logger.error('Access token has expired');
                    return res.status(HttpStatus.UNAUTHORIZED).json(
                        response[HttpStatus.UNAUTHORIZED]({
                            message: Auth.ACCESS_TOKEN_EXPIRED_ERROR_MESSAGE
                        })
                    );
                    case 'JsonWebTokenError':
                        logger.error('Invalid json web token error: ' + err.message);
                        return res.status(HttpStatus.FORBIDDEN).json(
                            response[HttpStatus.FORBIDDEN]({
                                message: err.message
                            })
                        );
                        }
                }
                res.locals.user = decoded; // If no error, token info is returned in 'decoded'

                next();
            });
        }

    public static getToken(req: Request): string {

        let methodName = 'getToken';

        let logger = loggerFactory(Auth.servicename, methodName);
        if (
            req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'Bearer'
        ) {
            logger.info('Returning Authorization token.');
            return req.headers.authorization.split(' ')[1];
        }
        logger.info('Returning blank token.');
        return '';
    }

    public static mount(_express: Application): Application {
        let methodName = 'mount';

        let logger = loggerFactory(Auth.servicename, methodName);

        logger.info('Booting the \'Auth\' middleware...');
        _express.use(Auth.verifyToken);

        return _express;
    }

}

export default Auth;
