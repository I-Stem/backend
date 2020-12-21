/**
 * Bootstrap your App
 *
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import App from './providers/App';

/**
 * Clear the console before the app runs
 */
App.clearConsole();

/**
 * Run the Database pool
 */
App.loadDatabase();

/**
 * Run the Server
 */
App.loadServer();
