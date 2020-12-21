/**
 * Defines validators for Tag
 *
 */

import * as Joi from '@hapi/joi';

const tagSchema = Joi.object({
    name: Joi.string(),
    userId: Joi.string()
});

export default tagSchema;
