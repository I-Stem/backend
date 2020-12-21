/**
 * Defines validators for forgot password
 *
 */
import * as Joi from '@hapi/joi';

const forgotSchema = Joi.object({
    email: Joi.string().email().required(),
    resetPasswordURL: Joi.string().required()
});

export default forgotSchema;
