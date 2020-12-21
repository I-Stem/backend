/**
 * Defines Custom method types over Express's Response
 *
 */

import { Response } from 'express';

export interface IResponse {
    success?: boolean;
    code?: number;
    flag?: string;
    message: string;
    data?: any;
    error?: any;
}
