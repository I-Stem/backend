/**
 * Defines validators for Hackathon
 *
 */

import * as Joi from "@hapi/joi";

const HackathonSchema = Joi.object({
    isPWD: Joi.boolean().required(),
    associatedDisabilities: Joi.array().required(),
    designation: Joi.string().required(),
    orgName: Joi.string().required(),
    canCode: Joi.boolean().required(),
    anythingElse: Joi.string().allow(""),
    preferedAreas: Joi.string().allow(""),
    expectations: Joi.string().allow(""),
});

export default HackathonSchema;
