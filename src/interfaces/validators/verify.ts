/**
 * Validator interface for verify user.
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface VerifyUserSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        email: String;
        verifyUserToken: String
    };
}
