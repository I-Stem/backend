/**
 * Defines validators
 *
 */

import * as Joi from '@hapi/joi';

import {
    ContainerTypes,
    // Use this as a replacement for express.Request
    ValidatedRequest,
    // Extend from this to define a valid schema type/interface
    ValidatedRequestSchema,
    // Creates a validator that generates middlewares
    createValidator
} from 'express-joi-validation';

const validator = createValidator();

const userSchema = Joi.object({
    name: Joi.string().required()
});
