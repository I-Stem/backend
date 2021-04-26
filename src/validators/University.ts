/**
 * Defines validators for University
 *
 */

import * as Joi from "@hapi/joi";

const UniversitySchema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().allow(""),
    address: Joi.string().allow(""),
    domain: Joi.string().allow(""),
    students: Joi.string().allow(""),
    staffs: Joi.string().allow(""),
    registeredByUser: Joi.string().allow(""),
    noStudentsWithDisability: Joi.string().allow(""),
    domainAccess: Joi.string().allow(""),
    escalationHandledBy: Joi.string().allow(""),
    handleAccessibilityRequests: Joi.string().allow(""),
});

export default UniversitySchema;
