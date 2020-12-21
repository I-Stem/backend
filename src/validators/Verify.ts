/**
 * Defines validators for verify user
 *
 */
import * as Joi from '@hapi/joi';

const verifySchema = Joi.object({
    email: Joi.string().email().required(),
    verifyUserToken: Joi.string().required()
});

export default verifySchema;
