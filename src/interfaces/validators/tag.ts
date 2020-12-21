/**
 * Validator interface for Tag.
 *
 */

import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export interface TagRequestSchema extends ValidatedRequestSchema {
    [ContainerTypes.Body]: {
        userId: String;
        name: String;
    };
}
