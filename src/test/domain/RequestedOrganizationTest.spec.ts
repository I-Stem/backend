import db from "../dbHandler";
import chai, { expect } from "chai";
import {RequestedOrganizationModel} from "../../domain/organization/RequestedOrganization";
import {OrganizationModelStubs} from "../mocks/domain/OrganizationModelStubs";
import { HandleAccessibilityRequests, OrganizationRequestedType, OrganizationRequestStatus } from "../../domain/organization/OrganizationConstants";

describe("organization creation request lifecycle tests", function() {
const organizationRequest = new RequestedOrganizationModel({
    organizationCode: OrganizationModelStubs.winterfellUniversity.code,
    organizationName: OrganizationModelStubs.winterfellUniversity.name,
organizationType: OrganizationRequestedType.UNIVERSITY
});

before(async function() {
    await db.createConnection();
        });

        after(async function() {
            await db.cleanup();
            await db.closeConnection();
        });
        

it("should successfully create organization", async function() {
await organizationRequest.persist();
expect(organizationRequest.status.length).to.be.greaterThan(1);
});

it("should successfully update status", async function() {
await RequestedOrganizationModel.updateStatus(
organizationRequest.organizationCode,
OrganizationRequestStatus.APPROVED,
HandleAccessibilityRequests.MANUAL,
false
);

const result = await RequestedOrganizationModel.getDetailsByOrganizationCode(organizationRequest.organizationCode);
expect(result.handleAccessibilityRequests).to.be.equal(HandleAccessibilityRequests.MANUAL);
});

});