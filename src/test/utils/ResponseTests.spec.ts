import {createResponse} from "../../utils/response";
import mocks from "node-mocks-http";
import HttpStatus from "http-status-codes";
import {expect} from "chai";

describe("test response function", async function () {

    it("should generate response", async function () {
const response = mocks.createResponse();
        expect(createResponse(response, HttpStatus.OK, "working")).to.be.not.null;
        expect(createResponse(response, 201, "working")).to.be.not.null;
        expect(createResponse(response, 202, "working")).to.be.not.null;
        expect(createResponse(response, 204, "working")).to.be.not.null;
        expect(createResponse(response, 400, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 401, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 402, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 403, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 404, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 406, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 409, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 422, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 500, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 501, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 502, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 503, "working", {error: true})).to.be.not.null;
        expect(createResponse(response, 505, "working", {error: true})).to.be.not.null;
    })
});
