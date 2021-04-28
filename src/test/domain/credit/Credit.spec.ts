import { expect } from "chai";
import Credits from "../../../domain/credit";

describe("test Credit API", async function () {

    it("get credits for non existing user as 0", async function() {
        const credits = await Credits.getUserCredits("");
        expect(credits).to.equal(0);
    });
});