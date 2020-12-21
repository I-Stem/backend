/**
 * Define all your routes
 *
 */

import { Application } from 'express';
import Locals from './Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import apiRouter from './../routes/Api';

class Routes {
    static servicename = 'Routes';
    public mountApi(_express: Application): Application {
        const methodname = 'mountApi';
        const logger = loggerFactory.call(this, Routes.servicename, methodname);
        const apiPrefix = Locals.config().apiPrefix;
        logger.info('Routes :: Mounting API Routes...');
        return _express.use(`/${apiPrefix}`, apiRouter);
    }

    public mountAdmin(_express: Application) {

        const methodname = 'mountAdmin';
        const logger = loggerFactory.call(this, Routes.servicename, methodname);
        logger.info('Routes :: Mounting Admin Routes...');
    }
}

export default new Routes();
