/**
 * Validator interface for forgot password.
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface ForgotRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        email: String;
        resetPasswordURL: String;
    };
}
