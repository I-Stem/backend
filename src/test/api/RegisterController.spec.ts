import request from "supertest";
import Express from "../../providers/Express";
import { UserType } from "../../domain/user/UserConstants";
import db from "../dbHandler";
import { expect } from "chai";

describe("User API endpoint tests", function () {
    const data = {
        userType: UserType.I_STEM,
        verificationLink: "http://www.example.com",
        email: "suman@inclusivestem.org",
        password: "password@123",
        fullname: "JOHN DOE",
        verifyToken: "",
    };
    before(async () => {
        await db.createConnection();
    });
    it("POST /auth/register", async () => {
        const response = await request(Express.init())
            .post("/api/auth/register")
            .set("Accept", "application/json")
            .send(data);
        expect(response.status).equals(200);
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
