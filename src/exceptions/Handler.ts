/**
 * Define the error & exception handlers
 *
 */

import loggerFactory from '../middlewares/WinstonLogger';
import Locals from '../providers/Locals';
import { response } from '../utils/response';
import * as HttpStatus from 'http-status-codes';
import { ContainerTypes } from 'express-joi-validation';
import { Request, Response, NextFunction } from 'express';
class ExceptionHandler {

static serviceName = 'ExceptionHandler';
    /**
     * Handles all the not found routes
     */
    public static notFoundHandler(_express: any): any {
const Log = loggerFactory(ExceptionHandler.serviceName, 'notFoundHandler');
const apiPrefix = Locals.config().apiPrefix;

_express.use('*', (req: Request, res: Response) => {
            const ip =
                req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            Log.error(`Path '${req.originalUrl}' not found [IP: '${ip}']!`);
            if (req.xhr || req.originalUrl.includes(`/${apiPrefix}/`)) {
                return res.json({
                    error: 'Page Not Found'
                });
            } else {
                return res.status(404).json({
                    error: 'Page Not Found'
                });
            }
        });

return _express;
    }

    /**
     * Handles your api/web routes errors/exceptions
     */
    public static clientErrorHandler(err: any, req: Request, res: Response, next: NextFunction): any {
const Log = loggerFactory(ExceptionHandler.serviceName, 'clientErrorHandler');
Log.error(err.stack);

if (req.xhr) {
            return res.status(500).json({ error: 'Something went wrong!' });
        } else {
            return next(err);
        }
    }

    /**
     * Show undermaintenance page incase of errors
     */
    public static errorHandler(err: any, req: Request, res: Response, next: NextFunction): any {
const Log = loggerFactory(ExceptionHandler.serviceName, 'errorHandler');
Log.error(err.stack);
res.status(500);

if (err.name && err.name === 'UnauthorizedError') {
                const innerMessage =
                    err.inner && err.inner.message
                        ? err.inner.message
                        : undefined;
                return res.json({
                    error: ['Invalid Token!', innerMessage]
                });
            }

return res.json({
                error: err
            });

    }

    /**
     * Show validation error
     */
    public static validationErrorHandler(
        err: any,
        req: Request,
        res: Response,
        next: NextFunction
    ): any {
const Log = loggerFactory(ExceptionHandler.serviceName, 'validationErrorHandler');
Log.error(JSON.stringify(err));

if (err && err.error && err.error.isJoi) {
            // we had a joi error, let's return a custom 400 json response
            res.status(HttpStatus.BAD_REQUEST).json(
                response[HttpStatus.BAD_REQUEST]({
                    message: err.error.toString()
                    // error: err.error
                })
            );
            Log.error(`Error: ${err.error.toString()}`);
        } else {
            // pass on to another error handler
            next(err);
        }
    }

    /**
     * Register your error / exception monitoring
     * tools right here ie. before "next(err)"!
     */
    public static logErrors(err: any, req: Request, res: Response, next: NextFunction): any {
const Log = loggerFactory(ExceptionHandler.serviceName, 'logErrors');
Log.error(err.stack);

return next(err);
    }
}

export default ExceptionHandler;
