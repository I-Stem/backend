/**
 * Defines validators for reset password
 *
 */
import * as Joi from '@hapi/joi';

const resetSchema = Joi.object({
    email: Joi.string().email().required(),
    passwordResetToken: Joi.string().required(),
    password: Joi.string().required()
});

export default resetSchema;
