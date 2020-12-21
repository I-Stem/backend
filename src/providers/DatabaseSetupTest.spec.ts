import 'leaked-handles';
import mongoose, {Database} from './Database';
import {DatabaseConfigSchema, databaseConfig} from './config/DatabaseConfig';
import chai from 'chai';
const should = chai.should();

describe('Check mongo db config', () => {

    it('must have mongo db environment variables', () => {
        const {error, value} = DatabaseConfigSchema.validate(databaseConfig);
        should.not.exist(error);
    });
});

describe('mongo db connection test', function()  {
this.timeout(20000);
it('must connect to database', async () => {
try {
    console.log('database url: ');
    console.log(process.env.MONGO_DB_URL);
    await Database.init();
} catch (error) {
    should.not.exist(error);
}

    });

after(async () => {
        await mongoose.disconnect();
            });

});

describe('Test some read/write database queries', function() {
this.timeout(20000);

let messageSchema = new mongoose.Schema ({
    message: String
});

let MessageModel = mongoose.model('TestMessage', messageSchema);

before(async () => {
   try {
       await mongoose.connect(databaseConfig.mongoDbURL + '/' + 'test', Database.options);
          } catch (error) {
              console.log(error);
              should.not.exist(error);
          }
});

it('Should write to database', async () => {

let testMessage = new MessageModel ({
    message: 'testing message to db' + new Date()
});

await testMessage.save(error => {
should.not.exist(error);
});

    });

it('should read the inserted values', async () => {
        await MessageModel.find((error, result) => {
should.not.exist(error);

console.log('inserted model instances');
console.log(result);
        });
    });

it('Should delete all inserted models', async () => {
        await MessageModel.deleteMany((error) => {
            should.not.exist(error);
        });
    });

after(async () => {
        await mongoose.disconnect();
            });

});
