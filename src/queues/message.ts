/**
 * Define message queue
 *
 */

import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import Template from '../models/Template';
import User from '../models/User';
import Message from '../models/Message';
import EmailService from '../services/EmailService';
import {MessageModel} from '../domain/MessageModel';

export class MessageQueue {
    public queue: any;
    static servicename = 'MessageQueue';

    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory(MessageQueue.servicename, methodname);
        this.queue = new Queue('sendMessage', {
            prefix: Locals.config().redisPrefix,
            redis: {
                host: Locals.config().redisHttpHost,
                db: Locals.config().redisDB,
                port: Locals.config().redisHttpPort,
                password: Locals.config().redisPassword
            },
            limiter: {
                max: 1000,
                duration: 5000
            }
        });

        this.queue
            .on('error', function(error: any) {
                logger.error(`Queue :: #${error} error processing `);
            })
            .on('waiting', (jobId: any, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on('active', (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on('completed', function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing`);
            });
        this.process();
    }


    public dispatch(_data: object): void {
        const logger = loggerFactory(MessageQueue.servicename, 'dispatch');
        const options = {
            attempts: 2
        };
        logger.info('sending the message to MessageQueue: %o', _data);
        this.queue.add(_data, options);
        logger.info('message sent...');
    }

    private process(): void {
        this.queue.process(this.deliverMessage);
    }

    public             deliverMessage(_job: any, _done: any)  {
        const logger = loggerFactory(MessageQueue.servicename, 'process');
        logger.debug( _job.data);

        if (_job.data?.isInternal) {
EmailService.sendEmailMessage(_job.data as MessageModel);
return _done();
        } else if (_job.data?.isInternal === false) {
            const message = new MessageModel(_job.data);
            message.persist();
            EmailService.sendEmailMessage(message);
            return _done();
        }
    }


}

export default new MessageQueue();
