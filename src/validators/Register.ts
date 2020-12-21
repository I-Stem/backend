/**
 * Defines validators for registration
 *
 */
import * as Joi from '@hapi/joi';
import { userType } from '../constants/userType';

const registrationSchema = Joi.object({
    userType: Joi.number()
        .allow(...Object.values(userType))
        .required(),
    verificationLink: Joi.string().required(),
    organisationName: Joi.string()
        .when('userType', { is: Joi.number().equal(5), then: Joi.required() })
        .min(3),
    organisationAddress: Joi.string().when('userType', {
        is: Joi.number().equal(5),
        then: Joi.required()
    }),
    noStudentsWithDisability: Joi.string().when('userType', {
        is: Joi.number().equal(5),
        then: Joi.required()
    }),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    fullname: Joi.string()
        .when('userType', {
            is: Joi.number().equal(2, 3, 7),
            then: Joi.required()
        })
        .min(3)
});

export default registrationSchema;
