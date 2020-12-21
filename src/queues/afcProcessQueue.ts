/**
 * Define cron job for afc status
 *
 */
import Queue from "bull";
import Locals from "../providers/Locals";
import loggerFactory from "../middlewares/WinstonLogger";
import AfcModel from "../models/AFC";
import { AFCRequestStatus } from "../domain/AfcModel";
import File from "../models/File";
import emailService from "../services/EmailService";
import { ExceptionTemplateNames } from "../MessageTemplates/ExceptionTemplates";
import MessageModel, { MessageLabel } from "../domain/MessageModel";
import AFCModel from '../domain/AfcModel';
/**
 *  AFC Process Queue for finding the status of every afc request.
 *  Time Interval: Past 2 Hrs to Past 1 Hr.
 *  If the request status is in waiting stage or initiated, mark them as failure and send internal diagonstic email
 */

class AFCProcessQueue {
    public queue: any;
    static servicename = "AFCProcess Queue";
    constructor() {
        const methodname = "constructor";
        const logger = loggerFactory.call(
            this,
            AFCProcessQueue.servicename,
            methodname
        );
        this.queue = new Queue("AFCProcess", {
            prefix: Locals.config().redisPrefix,
            redis: {
                host: Locals.config().redisHttpHost,
                db: Locals.config().redisDB,
                port: Locals.config().redisHttpPort,
                password: Locals.config().redisPassword,
            },
            limiter: {
                max: 1000,
                duration: 5000,
            },
        });

        this.queue
            .on("waiting", (jobId: string, _type: string) =>
                logger.info(`Queue :: #${jobId} waiting`)
            )
            .on("active", (job: any, _type: string) =>
                logger.info(`Queue :: #${job.id} started processing`)
            )
            .on("completed", function (job: any, result: any) {
                // Job completed with output result!
                logger.info(`Queue :: #${job.id} complete processing `);
            });
        this.process();
    }
    public dispatch(): void {
        const options = {
            repeat: {
                cron: "0 */1 * * *",
            },
        };
        this.queue.add({ cronJob: "cronJob" }, options);
    }
    private process(): void {
        const methodname = "process";
        const logger = loggerFactory.call(
            this,
            AFCProcessQueue.servicename,
            methodname
        );
        this.queue.process((_job: any, _done: any) => {
            logger.info(`Afc Process QUEUE`);
            const date = new Date();
            const twoHourAgo = new Date(
                date.getTime() - 2000 * 60 * 60
            ).toISOString();
            const hourAgo = new Date(
                date.getTime() - 1000 * 60 * 60
            ).toISOString();
            AFCModel.afcCronHandler(twoHourAgo, hourAgo);
            _done();
        });
    }
}

export default new AFCProcessQueue();
