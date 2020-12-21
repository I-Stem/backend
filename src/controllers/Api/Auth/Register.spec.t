import { MongoClient } from 'mongodb';
import Register from './Register';
import {
    connect,
    clearDatabase,
    closeDatabase
} from '../../../test/dbHandler';
// var mocks = require('node-mocks-http');
// import {EventEmitter} from 'events';

let mocks = {
    mockRequest: () => {
        const req = {};
        req.body = jest.fn().mockReturnValue(req);
        req.params = jest.fn().mockReturnValue(req);
        return req;
    },

    mockResponse: () => {
        const res = {};
        res.send = jest.fn().mockReturnValue(res);
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }
    // mockNext: () => jest.fn()
};

describe('Register user', () => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = connect();
    });

    it('Should create a user', async () => {
        const email = 'text@example.com';
        const password = 'hellohoney';
        // const req = mockRequest({ body: { email, password } })
        let req = mocks.mockRequest();
        req.body = { email, password };
        let res = mocks.mockResponse();
        await Register.perform(req, res);
        const data = res.json;
        console.log(data);
        expect(res.json).toHaveBeenCalledWith({
            message: ['You have been successfully registered with us!']
        });
    });

    afterAll(async () => {
        closeDatabase();
    });
});
