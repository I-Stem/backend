/**
 * Defines validators for Mentorship form
 *
 */

import * as Joi from '@hapi/joi';

const MentorshipSchema = Joi.object().keys({
    industry: Joi.string().required(),
    currentPosition: Joi.string().required(),
    isPWD: Joi.boolean().required(),
    associatedDisabilities: Joi.array(),
    signupAs: Joi.string().required().allow(''),
    learnSkills: Joi.when('signupAs', {
        is: (value: string) => !(value === 'mentee' || value === 'both'),
        then: (schema: any) => schema,
        otherwise: Joi.string().required()
    }),
    questionToMentor: Joi.string().allow(''),
    menteeAgreement: Joi.boolean().when('signupAs', {
        is: (value: string) => !(value === 'mentee' || value === 'both'),
        then: (schema: any) => schema,
        otherwise: Joi.boolean().required()
    }),
    mentorSkills: Joi.when('signupAs', {
        is: (value: string) => !(value === 'mentor' || value === 'both'),
        then: (schema: any) => schema,
        otherwise: Joi.string().required()
    }),
    connectOften: Joi.when('signupAs', {
        is: (value: string) => !(value === 'mentor' || value === 'both'),
        then: (schema: any) => schema,
        otherwise: Joi.string().required()
    }),
    questionToMentee: Joi.string(),
    pauseMentorship: Joi.boolean(),
    cancelMenteeship: Joi.boolean(),
    resumeMentorship: Joi.boolean(),
    anythingElse: Joi.string().allow(''),
    mentorshipStatus: Joi.array(),
    mentorshipId: Joi.string().optional()
});

export default MentorshipSchema;
