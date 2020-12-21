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
import MessageModel from '../domain/MessageModel';

class MessageQueue {
    public queue: any;
    static servicename = 'MessageQueue';

    private reg: any = {
        fullname: /__name__/g, // receivers email
        email: /__email__/g,
        contact: /__contact__/g,
        'approver.date': /__date__/g,
        'approver.time': /__time__/g,
        requestedAccomodations: /__accommodation__/g,
        accommodations: /__accommodationApproved__/g,
        roleName: /__role_name__/g,
        triggeredByName: /__triggered_by_name__/g,
        // invitationLink: /__invitation_link__/g,
        // loginLink: /__login_link__/g,
        message: /__message__/g,
        documentName: /__document_name__/g,
        link: /__link__/g
    };

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
    private mapTemplate(templateBody: any, obj: any) {

        for (const index in this.reg) {
            templateBody = templateBody.replace(
                this.reg[index],
                obj[index] || ''
            );
        }
        return templateBody;
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
        const logger = loggerFactory(MessageQueue.servicename, 'process');
        this.queue.process((_job: any, _done: any) => {
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

            let promises: any = [
                Template.findOne({ type: _job.data.type }),
                User.findById(_job.data.receiverId)
            ];
            if (_job.data.triggeredBy) {
                promises.push(User.findById(_job.data.triggeredBy));
            }
            return Promise.all(promises)
                .then(([template, user, triggeredBy]: any) => {
                    logger.debug(template, user, triggeredBy);
                    _job.data = { ...user?.toJSON(), ..._job.data };
                    _job.data['triggeredByName'] = triggeredBy?.fullname;
                    let mesgData: any = {
                        triggeredBy: _job.data.triggeredBy,
                        receiverId: _job.data.receiverId,
                        body: this.mapTemplate(template?.body, _job.data),
                        subject: this.mapTemplate(template?.subject, _job.data),
                        text: this.mapTemplate(template?.text, _job.data),
                        link: this.mapTemplate(template?.link, _job.data),
                        label: this.mapTemplate(template?.name, _job.data),
                        status: 1,
                        templateId: template?.id
                    };
                    logger.info(mesgData);
                    return new Message(mesgData)
                        .save()
                        .then((mesg) => {
                            if (template?.isEmail) {
                                mesgData['id'] = mesg.id;
                                mesgData['to'] = user?.email;
                                EmailService.sendMail(mesgData);
                            }
                            _done();
                        })
                        .catch((error: Error) => {
                            logger.error(error.message);
                            _done();
                        });
                })
                .catch((error: Error) => {
                    logger.error(error.message);
                });
        });
    }
}

export default new MessageQueue();
