/**
 * Define Database connection
 *
 */

import mongoose, {Connection} from 'mongoose';
import { MongoError } from 'mongodb';

import {databaseConfig, DatabaseConfigSchema} from './config/DatabaseConfig';
import Locals from './Locals';
import loggerFactory from '../middlewares/WinstonLogger';

export class Database {

    public static readonly options: mongoose.ConnectionOptions  = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true, // should be removed for production
        serverSelectionTimeoutMS: 15000,
        w: 'majority'
    };

    static databaseInstance: any;
    static servicename = 'Database';
    // Initialize your database pool
    public static async init(): Promise<any> {

        if (Database.databaseInstance) {
return Database.databaseInstance;
        }

        const methodname = 'init';
        const logger = loggerFactory.call(this, Database.servicename, methodname);

        const  dsn: string = this.getDatabaseString();

        logger.info(`Retrieved database url: ${dsn}`);

        try {
        Database.databaseInstance = await mongoose.connect(<string> dsn, Database.options);
        } catch ( error ) {
            // handle the error case

            if (error) {
                logger.error(`Failed to connect to the Mongo server!! ${error}`);
                throw error;
            } else {
                logger.info('connected to mongo server at: ' + dsn);
            }
        }

        console.log('connected to mongo server at: ' + dsn);

        return Database.databaseInstance;

    }

    private static getDatabaseString(): string {
        const logger = loggerFactory.call(this, Database.servicename, 'getDatabaseString');

        const {error, value} = DatabaseConfigSchema.validate(databaseConfig);
        if (error) {
            logger.error(`Error in mongo configuration: ${error}`);
            throw error;
        }
        return databaseConfig.mongoDbURL + '/' + databaseConfig.mongoDbName;
    }
}

export default mongoose;
