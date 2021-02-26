import request from "supertest";
import app from "../../routes/Api";
import { UserType } from "../../domain/user/UserConstants";
import db from "../dbHandler";
import { expect } from "chai";

describe("User API endpoint tests", function () {
    const data = {
        userType: UserType.I_STEM,
        verificationLink: "",
        email: "suman@inclusivestem.org",
        password: "password@123",
        fullname: "JOHN DOE",
        verifyToken: "",
    };
    before(async () => {
        await db.createConnection();
    });
    it("POST /auth/register", async () => {
        const response = await request(app)
            .post("/auth/register")
            .set("Accept", "application/json")
            .send(data);
        expect(response.status).equals(200);
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
