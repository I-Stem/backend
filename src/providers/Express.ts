/**
 * Primary file for your API Server
 *
 */

import express from 'express';

import Locals from './Locals';
import Routes from './Routes';
import Bootstrap from '../middlewares/Kernel';
import ExceptionHandler from '../exceptions/Handler';
import Verify from '../queues/verify';
import AfcProcessQueue from '../queues/afcProcessQueue';
import loggerFactory from '../middlewares/WinstonLogger';
import { httpLogger } from '../middlewares/HttpLogger';
import { http } from 'winston';

class Express {
    static servicename = 'Express';
    public express: express.Application;

    /**
     * Initializes the express server
     */
    constructor() {
        this.express = express();

        this.mountHttpLogger(this.express);
        this.mountDotEnv();
        this.mountMiddlewares();
        this.mountRoutes();
    }

    private mountDotEnv(): void {
        const methodname = 'mountDotEnv';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        this.express = Locals.init(this.express);
        logger.info('Mounted dotenv...');
    }
    /**
     * Mounts all the defined middlewares
     */
    private mountMiddlewares(): void {
        const methodname = 'mountMiddlewares';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        this.express = Bootstrap.init(this.express);
        Routes.mountAdmin(this.express);
        logger.info('Mounted middlewares...');
    }
    /**
     * Mounts all the defined routes
     */
    private mountRoutes(): void {
        const methodname = 'mountRoutes';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        this.express = Routes.mountApi(this.express);

        // todo: is it really needed?
        this.express._router.stack.forEach(function (r: any) {
            if (r.route && r.route.path) {
                logger.info(`Mounting ${r.route.path}`);
            }
        });

        logger.info('Mounted routes...');
    }
    /**
     * Mounts cron job
     */
    private mountCron(): void {
        const methodname = 'mountCron';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        logger.info('Verifying tokens...');
        Verify.dispatch();
        
    }

    private mountAfcCron(): void {
        const methodname = 'mountAfcCron';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        logger.info('Retrieving status of AFC Requests...');
        AfcProcessQueue.dispatch();
    }

    /**
     * Starts the express server
     */
    public init(): any {
        const methodname = 'init';
        const logger = loggerFactory.call(this, Express.servicename, methodname);
        const port: number = Locals.config().port;

        // Registering Exception / Error Handlers
        this.express.use(ExceptionHandler.logErrors);
        this.express.use(ExceptionHandler.validationErrorHandler);
        this.express.use(ExceptionHandler.clientErrorHandler);

        this.express.use(ExceptionHandler.errorHandler);
        this.express = ExceptionHandler.notFoundHandler(this.express);

        // Start the server on the specified port
        this.express.listen(port, () => {
            this.mountCron();
            this.mountAfcCron();
            return logger.info(`Server :: Running @ 'http://localhost:${port}'`);
        }).on('error', (e: any) => {
            if (e.code === 'EADDRINUSE') {
                return console.log(' Port is already being used. Please free the Port first and start the server again ');
            }
            return console.log(' Error : ', e);
        });
    }

    public mountHttpLogger(express: any): void {
        const methodname = 'mountHttpLogger';
        const logger = loggerFactory(Express.servicename, methodname);
        logger.info('Mounting Http Logger...');

        express.use(httpLogger);
    }
}

/** Export the express module */
export default new Express();
