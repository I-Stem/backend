/**
 * Defines all the app-statics
 *
 */

import * as path from 'path';
import * as express from 'express';

import loggerFactory from './WinstonLogger';

class Statics {
    static servicename = 'Statics';

    public static mount(_express: express.Application): express.Application {
        const methodname = 'mount';
        const logger = loggerFactory.call(this, Statics.servicename, methodname);
        logger.info('Booting the \'Statics\' middleware...');

        // Loads Options
        const options = { maxAge: 31557600000 };

        // Load Statics
        _express.use(
            '/public',
            express.static(path.join(__dirname, '../../public'), options)
        );
        logger.info(`Static path added...` );

        // Load NPM Statics
        _express.use(
            '/vendor',
            express.static(path.join(__dirname, '../../node_modules'), options)
        );
        logger.info('NPM statics added...');

        return _express;
    }
}

export default Statics;
