/**
 * Defines validators for registration
 *
 */
import * as Joi from "@hapi/joi";
import { UserType } from "../domain/user/UserConstants";

const registrationSchema = Joi.object({
    userType: Joi.string()
        .allow(UserType.BUSINESS, UserType.UNIVERSITY, UserType.I_STEM, UserType.VOLUNTEER)
        .required(),
    verificationLink: Joi.string().required(),
    organizationName: Joi.string(),
    // .when('userType', { is: Joi.number().equal(5), then: Joi.required() })
    // .min(3),
    // .when('userType', {
    //     is: Joi.number().equal(5),
    //     then: Joi.required()
    // }),
    noStudentsWithDisability: Joi.string(),
    // .when('userType', {
    //     is: Joi.number().equal(5),
    //     then: Joi.required()
    // }),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    fullname: Joi.string()
        .when("userType", {
            is: Joi.number().equal(2, 3, 7),
            then: Joi.required(),
        })
        .min(3),
    verifyToken: Joi.string().allow(""),
    context: Joi.string().allow("")
});

export default registrationSchema;
