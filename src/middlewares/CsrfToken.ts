/**
 * Enables CSRF Token authorizaton for
 * your routes
 *
 */

import { Application } from 'express';
import * as lusca from 'lusca';
import { Request, Response, NextFunction } from 'express';
import loggerFactory from '../middlewares/WinstonLogger';
import Locals from '../providers/Locals';

class CsrfToken {
    static servicename = 'CsrfToken';

    public static mount(_express: any): Application {
        const methodname = 'mount';
        const logger = loggerFactory.call(this, CsrfToken.servicename, methodname);
        logger.info('Booting the \'CsrfToken\' middleware...');

        _express.set('trust proxy', 1);

        // Interpolate the user variable into your pug files
        _express.use((req: Request, res: Response, next: NextFunction) => {
            // res.locals.user = req?.user;
            res.locals.app = Locals.config();
            next();
        });

        // Check for CSRF token iff the original url
        // does not contains the api substring
        _express.use((req: Request, res: Response, next: NextFunction) => {
            const apiPrefix = Locals.config().apiPrefix;

            if (req.originalUrl.includes(`/${apiPrefix}/`)) {
                logger.info('URL contains api prefix. Moving Forward...');
                next();
            } else {
                logger.info('URL doesn\'t contain api prefix. Checking for CSRF Token');
                lusca.csrf()(req, res, next);
            }
        });

        // Enables x-frame-options headers
        _express.use(lusca.xframe('SAMEORIGIN'));
        logger.info('Enabled x-frame options');
        // Enables xss-protection headers
        _express.use(lusca.xssProtection(true));
        logger.info('Enabled xss protection');

        return _express;
    }
}

export default CsrfToken;
