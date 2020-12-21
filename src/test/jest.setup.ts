// import 'reflect-metadata'
// import * as winston from "winston";

// don't log while running tests
// winston.remove(winston.transports.Console);
// winston.remove(winston.transports.File);

import * as path from 'path';
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import db from './dbHandler';
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// jest.setTimeout(30000);

import App from '../providers/App';
// require('../../seed');

App.loadDatabase();
App.loadServer();

before(async () => {
    console.log('beforeAll');
    await db.createConnection();
});

after(async () => {
    // We should delete the test db after all tests are completed
    // await connection.close();
    await db.closeConnection();
    // await db.cleanup();
    console.log('afterAll');
});
