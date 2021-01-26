/**
 * Define cron job for user verification
 *
 */
import Queue from 'bull';
import Locals from '../providers/Locals';
import loggerFactory from '../middlewares/WinstonLogger';
import User, { IUserModel } from '../models/User';
import ArchivedUser from '../models/ArchivedUser';
import { servicesVersion } from 'typescript';

class VerifyQueue {
    public queue: any;
    static servicename = 'Verify Queue';
    constructor() {
        const methodname = 'constructor';
        const logger = loggerFactory.call(this, VerifyQueue.servicename, methodname);
        this.queue = new Queue('verify', {
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
            .on('waiting', (jobId: string, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on('active', (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on('completed', function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing `);
            });
        this.process();
    }
    public dispatch(): void {
        const options = {
            repeat: {
                cron: '15 3 * * *'
            }
        };
        this.queue.add({ cronJob: 'cronJob' }, options);
    }
    private process(): void {
        const methodname = 'process';
        const logger = loggerFactory.call(this, VerifyQueue.servicename, methodname);
        this.queue.process((_job: any, _done: any) => {
            User.find({ isVerified : false, verifyUserExpires: { $lt: new Date() } }, (err: Error, data: Array<IUserModel>) => {
                if (err) {
                    logger.error(err.message);
                } else {
                    ArchivedUser.insertMany(data, (err: Error) => {
                        if (err) {
                            logger.error(err.message);
                        } else {
                            logger.info('Archived user populated');
                        }
                    });
                    const userIds = data.map(value => value._id);
                    User.deleteMany({_id: {$in: userIds }}, (err: Error) => {
                        if (err) {
                            logger.error(err.message);
                        } else {
                            logger.info('User database cleared of unverifed users');
                        }
                    });
                }
                _done();
            });
        });
    }
}

export default new VerifyQueue();
