import Auth from './Auth';
import td from 'testdouble';
import httpMocks from 'node-mocks-http';
import { NextFunction } from 'express';
import chai from 'chai';
const should = chai.should();

describe('Test jwt verification token middleware process', function() {

    afterEach(() => {
        td.reset();
    });

    it('Should bipass authentication requirement for auth routes', () => {
        let fakeNext: NextFunction = td.function<NextFunction>();
        let req = httpMocks.createRequest(
    {
        method: 'POST',
        url : '/auth/login'
    }
);

        let res = httpMocks.createResponse();

        Auth.verifyToken(req, res, fakeNext);

        td.verify(fakeNext());
    });

    it('Should throw 401 for missing access token', () => {

    let req = httpMocks.createRequest(
        {
            method: 'POST',
            url: '/api/afc'
        }
    );

    let res = httpMocks.createResponse();

    Auth.verifyToken(req, res, null);

    res.statusCode.should.be.equal(401);
    res._getJSONData().message.should.be.equal(Auth.ACCESS_TOKEN_MISSING_ERROR_MESSAGE);

});

    it('Should throw 401 for invalid token', () => {
    let req = httpMocks.createRequest(
        {
            method: 'POST',
            url: '/api/afc',
            headers : {
                authorization: 'hello world'
            }
        }
    );

    let res = httpMocks.createResponse();

    Auth.verifyToken(req, res, null);

    res.statusCode.should.be.equal(401);
    res._getJSONData().message.should.be.equal(Auth.ACCESS_TOKEN_MISSING_ERROR_MESSAGE);
});

    it('Should throw 403 for invalid json web token', () => {
    let req = httpMocks.createRequest(
        {
            method: 'POST',
            url: '/api/afc',
            headers : {
                authorization: 'Bearer world'
            }
        }
    );

    let res = httpMocks.createResponse();

    Auth.verifyToken(req, res, null);

    res.statusCode.should.equal(403);

});

});
