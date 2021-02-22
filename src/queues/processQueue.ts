/**
 * Define cron job for afc and vc status
 *
 */
import Queue from "bull";
import Locals from "../providers/Locals";
import loggerFactory from "../middlewares/WinstonLogger";
import {AfcModel} from '../domain/AfcModel';
import {VcModel} from "../domain/VcModel";
/**
 *  AFC Process Queue for finding the status of every afc request.
 *  Time Interval: Past 2 Hrs to Past 1 Hr.
 *  If the request status is in waiting stage or initiated, mark them as failure and send internal diagonstic email
 */

class ProcessQueue {
    public queue: any;
    static servicename = "Process Queue";
    constructor() {
        const methodname = "constructor";
        const logger = loggerFactory.call(
            this,
            ProcessQueue.servicename,
            methodname
        );
        this.queue = new Queue("Process", {
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
            ProcessQueue.servicename,
            methodname
        );
        this.queue.process((_job: any, _done: any) => {
            logger.info(`Process QUEUE`);
            const date = new Date();
            const hourAgo = new Date(
                date.getTime() - 1000 * 60 * 60
            ).toISOString();
            const now = date.toISOString();
            AfcModel.afcCronHandler(hourAgo, now);
            VcModel.vcCronHandler(hourAgo, now);
            _done();
        });
    }
}

export default new ProcessQueue();
