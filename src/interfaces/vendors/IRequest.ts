/**
 * Defines Custom method types over Express's Request
 *
 */

import { Request } from 'express';

export interface IRequest extends Request {
    logIn(user: any, callback: any): any;
    logout(): void;
    user: any;
}
