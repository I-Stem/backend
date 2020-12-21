/**
 * Validator interface for reset password.
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface ResetRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        email: string;
        passwordResetToken: string;
        password: string;
    };
}
