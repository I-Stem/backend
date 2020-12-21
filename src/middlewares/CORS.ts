/**
 * Enables the CORS
 *
 */

import cors from 'cors';
import { Application } from 'express';

import loggerFactory from './WinstonLogger';
import Locals from '../providers/Locals';

class CORS {
    static servicename = 'CORS';

    public mount(_express: Application): Application {
        const methodname = 'mount';
        const logger = loggerFactory(CORS.servicename, methodname);
        logger.info('Booting the \'CORS\' middleware...');

        const options = {
            origin: Locals.config().url,
            optionsSuccessStatus: 200 // Some legacy browsers choke on 204
        };

        _express.use(cors(options));
        logger.info('CORS options added...');
        return _express;
    }
}

export default new CORS();
