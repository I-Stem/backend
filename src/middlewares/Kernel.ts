/**
 * Register your Express middlewares
 *
 */

import { Application } from 'express';

import CORS from './CORS';
import Http from './Http';
import Statics from './Statics';
import CsrfToken from './CsrfToken';
import StatusMonitor from './StatusMonitor';
import Auth from './Auth';

import Locals from '../providers/Locals';
import loggerFactory from './WinstonLogger';

class Kernel {
    static servicename = 'Kernel';
    public static init(_express: Application): Application {
        const methodname = 'init';
        const logger = loggerFactory(Kernel.servicename, methodname);
        // Check if CORS is enabled
        if (Locals.config().isCORSEnabled) {
            // Mount CORS middleware
            _express = CORS.mount(_express);
            logger.info('CORS enabled...');
        }

        // Mount basic express apis middleware
        _express = Http.mount(_express);
        logger.info('Express APIs middleware mounted...');

        // Mount csrf token verification middleware
        // _express = CsrfToken.mount(_express);

        // Mount statics middleware
        _express = Statics.mount(_express);
        logger.info('Static middleware mounted...');

        // Mount authorisation header middleware
        _express = Auth.mount(_express);
        logger.info('Authorization mounted...');

        // Mount status monitor middleware
        _express = StatusMonitor.mount(_express);
        logger.info('Status Monitor mounted...');

        return _express;
    }
}

export default Kernel;
