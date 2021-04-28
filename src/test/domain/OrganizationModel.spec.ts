import { expect } from "chai";
import db from "../dbHandler";
import {OrganizationModel} from "../../domain/organization";
import UserModel from "../../domain/user/User";
import { OAuthProvider, ServiceRoleEnum, UserType } from "../../domain/user/UserConstants";
import { DomainAccess, UniversityAccountStatus } from "../../domain/organization/OrganizationConstants";
import {OrganizationModelStubs} from "../mocks/domain/OrganizationModelStubs";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";

describe("Unit tests for organization flow", () => {
    const john = UserModelStubs.JohnSnow;
    const arya = UserModelStubs.AryaStark;
    const winterfell = OrganizationModelStubs.winterfellUniversity;

    before(async () => {
        await db.createConnection();

        await john.persist();
        await arya.persist();
    });

    it("should create a new organization", async function () {
        await winterfell.persistUniversity(john?.userId || "");
    });

    describe("university model", function () {
        it("should return university model by university code", async function () {
            const org = await OrganizationModel.getUniversityByCode(winterfell.code);

            expect(org.code).to.be.equal(winterfell.code);
        });

        it("should change account status to APPROVED", async function () {
            await winterfell.changeAccountStatusTo(UniversityAccountStatus.APPROVED);

            expect(winterfell.accountStatus).to.be.equal(UniversityAccountStatus.APPROVED);
        });

        it("should update the address", async function() {
            const ADDRESS = "NORTH";
await winterfell.registerUniversity({
    code: winterfell.code,
    address: ADDRESS
}, john.userId);

expect(ADDRESS).to.be.equal(ADDRESS);
        });

        it("should raise request for email domain change", async function() {
            await winterfell.updateUniversity({
                code: winterfell.code,
                domain: "snow.com",
domainAccess: DomainAccess.AUTO
            }, john.userId);

        });

        it("should calculate metrics on afc and vc requests", async function() {
            await OrganizationModel.getMetricsByUniversityCode(winterfell.code);
        });

        it("should get students of university", async function() {
            const results = await OrganizationModel.getStudentsByUniversityCode(winterfell.code, 10,0);

expect(results.length).to.be.equal(2);
        });

        it("should get all activities of a student of university", async function() {
            const results = await OrganizationModel.getStudentActivityByUserId(john.userId);

            expect(results.afcActiveActivity.length).to.be.equal(0);
        });

        it("should return no university for nonexisting email domain", async function() {
            const result = await OrganizationModel.findUniversityByDomainName("martel.com");

            expect(!result).to.be.equal(true);
        })
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
