import 'leaked-handles';
import Queue from 'bull';
import * as Joi from '@hapi/joi';
import {queueConfig, QueueConfigSchema} from './config/QueueConfig';
import Redis from 'ioredis';
import chai from 'chai';
const should = chai.should();

function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

describe('Test redis queue configuration', function() {
    it('Check that all required queue environment variables are set.', () => {
        const {error, value} = QueueConfigSchema.validate(queueConfig);
        should.not.exist(error);
    });
});

describe('Checking connection with redis cache', function() {
    this.timeout(25000);

    it('Must be able to connect to redis queue', async () => {
        let redisConnection: Redis.Redis = new Redis(            {
            port: queueConfig.queuePort,
            host: queueConfig.queueURL,
            password : queueConfig.queuePassword,
            db: queueConfig.queueDbIndex,
            lazyConnect: true
        });

        await redisConnection.connect().catch(async error => {
            console.log('unable to make connection to redis');
            console.log(error);
            // failing the test because couldn't connect to redis
            should.not.exist(error);
        });

        await redisConnection.disconnect();
    });

});

describe('Testing bull queue setup', function() {
    this.timeout(25000);
    let testQueue: Queue.Queue;
    it('create test queue and test producer', async () => {

testQueue =  new Queue('test-queue', {
            prefix: queueConfig.queuePrefix,
            redis: {
                port: queueConfig.queuePort,
                host: queueConfig.queueURL,
                password : queueConfig.queuePassword,
                db: queueConfig.queueDbIndex
            }
        });

testQueue.process( job => {
            console.log('got message in consumer: ' );
            console.log(job);
             // done(null, "succeeded");
            return 'succeeded';
                });

        /*
                testQueue.on('failed', async error => {
                    console.error("test consumer for redis test-queue failed");
                    expect(1).toBe(0);
                })
            .on('completed',  async result => {
            console.log("successfully read the value");
            })
            .on('error' , error => {
                console.log("got an error: ");
                console.log(error);
            })
            .on('paused', () => {
                console.log("job event:paused");
            })
            .on('waiting', job => {
                console.log("job event:waiting");
                            })
                            .on('stalled', job => {
                                console.log("job event:stalled");
                            })
                            .on('active', job => {
                                console.log("job event:active")
                            })
            ;
          */

await  testQueue
        .add( {message: 'publishing test message to test-queue at ' + new Date()})
        .then(res => {
            console.log('successful response' );
            console.log(res);
        }).catch(error => {
            console.log('encountered an error in bull queue initialization');
            should.not.exist(error);
        });
    });

    it('Bull queue consumer is working',  async () => {

await sleep(2000);
await testQueue.count().then(result => {
    result.should.equal(0);
});
});

    after(async () => {
    await testQueue.close();
});
});
