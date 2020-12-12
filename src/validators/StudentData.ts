import * as Joi from "@hapi/joi";

const StudentSchema = Joi.object().keys({
    NAME: Joi.string().max(50).required().disallow(null),
    EMAIL: Joi.string().email().max(100).required().disallow(null),
    ROLL_NUMBER: Joi.string()
        .regex(/^[0-9]+$/)
        .max(50)
        .allow(null),
});

const emailSchema = Joi.object().keys({
    email: Joi.string().max(100).email().disallow(null),
});

export default {StudentSchema, emailSchema};
