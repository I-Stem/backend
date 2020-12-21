/**
 * Define interface for login validation
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface LoginRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        email: String;
        password: String;
    };
}
