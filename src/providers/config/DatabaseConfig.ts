import * as Joi from '@hapi/joi';

export const DatabaseConfigSchema = Joi.object().keys({
    mongoDbURL: Joi.string().required(),
    mongoDbName: Joi.string().required()
});

export const databaseConfig: {mongoDbURL: string, mongoDbName: string} = {
    mongoDbURL: <string>process.env.MONGO_DB_URL,
    mongoDbName : <string>process.env.MONGO_DB_NAME
};
