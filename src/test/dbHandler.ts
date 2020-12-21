import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

// May require additional time for downloading MongoDB binaries
// jest.DEFAULT_TIMEOUT_INTERVAL = 600000;
const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
};
let mongoServer: any;

// Created the below functions to open and close the connections after every test

const createConnection = async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri, opts, (err) => {
        if (err) {
            console.error(err);
        }
    });
};

const closeConnection = async () => {
    console.log('closeConnection');
    await mongoose.disconnect();
    await mongoServer.stop();
};

const cleanup = async () => {
    const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
    console.log('cleanup');
    return Promise.all(
        collections
            .map(({ name }) => name)
            .map((collection) =>
                mongoose.connection.db.collection(collection).drop()
            )
    );
};

export default {
    createConnection,
    closeConnection,
    cleanup
};
