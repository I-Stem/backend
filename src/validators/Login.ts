/**
 * Defines validators for login
 *
 */
import * as Joi from '@hapi/joi';

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
});

export default loginSchema;
