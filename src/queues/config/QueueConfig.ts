const dotenv = require('dotenv');
import * as path from 'path';
import * as Joi from '@hapi/joi';

// import 'joi-extract-type';

export const QueueConfigSchema = Joi.object().keys({
queuePort: Joi.number().required(),
queueURL : Joi.string().required(),
queueDbIndex : Joi.number().required(),
queuePrefix : Joi.string().required()
// queuePassword : Joi.string().required()
});

// export type QueueConfigSchema = Joi.extractType<typeof queueConfigSchema>;

export const queueConfig = {
queuePort : Number(process.env.REDIS_QUEUE_PORT),
queueURL : process.env.REDIS_QUEUE_URL,
queuePrefix : process.env.REDIS_QUEUE_PREFIX,
// queuePassword : process.env.REDIS_QUEUE_PASSWORD,
queueDbIndex : Number(process.env.REDIS_QUEUE_DB)
};
