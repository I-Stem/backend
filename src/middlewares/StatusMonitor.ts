/**
 * Define & configure your status monitor
 *
 */

import { Application } from 'express';
import expressStatusMonitor from 'express-status-monitor';

import loggerFactory from './WinstonLogger';
import Locals from '../providers/Locals';

class StatusMonitor {
    static servicename = 'Status Monitor';

    public mount(_express: Application): Application {
        const methodname = 'mount';
        const logger = loggerFactory.call(this, StatusMonitor.servicename, methodname);
        logger.info('Booting the \'StatusMonitor\' middleware...');

        const api: string = Locals.config().apiPrefix;

        // Define your status monitor config
        const monitorOptions: object = {
            title: Locals.config().name,
            path: '/status-monitor',
            spans: [
                {
                    interval: 1, // Every second
                    retention: 60 // Keep 60 data-points in memory
                },
                {
                    interval: 5,
                    retention: 60
                },
                {
                    interval: 15,
                    retention: 60
                }
            ],
            chartVisibility: {
                mem: true,
                rps: true,
                cpu: true,
                load: true,
                statusCodes: true,
                responseTime: true
            },
            healthChecks: [
                {
                    protocol: 'http',
                    host: 'localhost',
                    path: '/',
                    port: Locals.config().port
                },
                {
                    protocol: 'http',
                    host: 'localhost',
                    path: `/${api}`,
                    port: Locals.config().port
                }
            ]
        };

        // Loads the express status monitor middleware
        _express.use(expressStatusMonitor(monitorOptions));
        logger.info('Status Monitor added...');
        return _express;
    }
}

export default new StatusMonitor();
