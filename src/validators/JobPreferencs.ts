/**
 * Defines validators for Job Preferences
 *
 */

import * as Joi from "@hapi/joi";

const JobPreferencesSchema = Joi.object({
    seekingJob: Joi.boolean().required(),
    natureOfJob: Joi.string().required(),
    industry: Joi.string().required(),
    idealPosition: Joi.string().required(),
    highestEducation: Joi.string().required(),
    highestDegree: Joi.string().required(),
    major: Joi.string().allow(""),
    workExperience: Joi.string().allow(""),
    totalExperience: Joi.string().required(),
    associatedDisabilities: Joi.array().required(),
    currentPlace: Joi.string().required(),
    canRelocate: Joi.boolean().required(),
    linkedIn: Joi.string().allow(""),
    portfolioLink: Joi.string().allow(""),
    resumeLink: Joi.string().allow(""),
    needCareerHelp: Joi.boolean().required(),
    inputFileId: Joi.string().required(),
});

export default JobPreferencesSchema;
