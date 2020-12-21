/**
 * Primary file for your API Server
 *
 */

import Express from './Express';
import 'reflect-metadata';
import { Database } from './Database';
import loggerFactory from '../middlewares/WinstonLogger';

class App {
    static servicename = 'App';
    public clearConsole(): void {
        const methodname = 'clearConsole';
        const logger = loggerFactory.call(this, App.servicename, methodname);
        process.stdout.write('\x1B[2J\x1B[0f');
        logger.info('clear console');
    }

    public loadServer(): void {
        const methodname = 'loadServer';
        const logger = loggerFactory.call(this, App.servicename, methodname);
        logger.info('Server :: Booting @ Master...');

        Express.init();
    }

    public loadDatabase(): void {
        const methodname = 'loadDatabase';
        const logger = loggerFactory.call(this, App.servicename, methodname);
        logger.info('Database :: Booting @ Master...');

        Database.init();
    }
}

export default new App();
