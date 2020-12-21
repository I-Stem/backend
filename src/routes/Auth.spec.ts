import * as request from 'supertest';
import * as faker from 'faker';
import Express from '../providers/Express';
const app = Express.express;
import db from '../test/dbHandler';

const registerUserObj = {
    email: faker.internet.email(),
    password: faker.internet.password(),
    userType: 2,
    fullname: faker.name.findName()
};
const loginUserObj = {
    email: registerUserObj.email,
    password: registerUserObj.password
};

describe('Auth Routes', () => {
    describe('POST /api/auth/register', () => {
        it('should return status code 200', async done => {
            const result = await request(app)
                .post('/api/auth/register')
                .send(registerUserObj)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    expect(response.body.flag).toBe('Ok');
                    expect(response.body.code).toBe(200);
                    expect(response.body.message).toBe('You have been successfully registered with us!');
                    done();
                });
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return status code 404', async done => {
            const result = await request(app)
                .post('/api/auth/login')
                .send({email: loginUserObj.email, password: faker.internet.password()})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(response => {
                    expect(response.body.code).toBe(404);
                    expect(response.body.message).toBe('User not found');
                    done();
                });
        });

        it('should return status code 200', async done => {
            const result = await request(app)
                .post('/api/auth/login')
                .send(loginUserObj)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                // .expect(200)
                .then(response => {
                    console.log(response);
                    // assert(response.body.email, 'foo@bar.com')
                    done();
                });
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        it('should return status code 404', async done => {
            const result = await request(app)
                .post('/api/auth/login')
                .send({email: loginUserObj.email, password: faker.internet.password()})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(response => {
                    expect(response.body.code).toBe(404);
                    expect(response.body.message).toBe('User not found');
                    done();
                });

        });
        it('should return status code 200', async done => {
            const result = await request(app)
                .post('/api/auth/login')
                .send(loginUserObj)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                // .expect(200)
                .then(response => {
                    // assert(response.body.email, 'foo@bar.com')
                    done();
                });

        });
    });
});
