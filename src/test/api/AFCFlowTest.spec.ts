import httpMocks from "node-mocks-http";
import db from "../dbHandler";
import {OrganizationModelStubs} from "../mocks/domain/OrganizationModelStubs";
import { expect } from "chai";
import { AFCRequestOutputFormat, DocType } from "../../domain/AfcModel/AFCConstants";
import FileModel from "../../domain/FileModel";
import UserModel from "../../domain/user/User";
import { OAuthProvider, UserType, ServiceRoleEnum } from "../../domain/user/UserConstants";
import { HandleAccessibilityRequests, UniversityRoles } from "../../domain/organization/OrganizationConstants";
import requestPromise from "request-promise-native";
import { FileProcessAssociations } from "../../domain/FileModel/FileConstants";
import {AfcRequestQueue} from "../../queues/afcRequest";
import Sinon from "sinon";
import Credit from "../../domain/Credit";
import AFCController from "../../controllers/Api/AFC";
import { OrganizationModel } from "../../domain/organization";


describe("AFC request API endpoint tests", function () {
    let requester:any;
    const data = {
        documentName: "cool document",
        tag: "",
        outputFormat: AFCRequestOutputFormat.HTML,
        inputFileId: "",
        docType: DocType.NONMATH,
        status: 1
    };
    before(async () => {
        await db.createConnection();
       requester = new UserModel({
            fullname: "john snow",
            userType:  UserType.I_STEM,
            organizationCode: "G.O.T",
            email: "john@winterfell.com",
            role: UniversityRoles.STUDENT,
            oauthProvider: OAuthProvider.GOOGLE,
            serviceRole: ServiceRoleEnum.PREMIUM
        })
        requester = await requester.persist();
        const file = new FileModel({
hash: "hello",
name: "cool document",
userContexts: [{userId: requester.userId, organizationCode: "worldOrganization", associatedAt: new Date(), processAssociation: FileProcessAssociations.AFC_INPUT}],
container: "store",
inputURL: "http://world.com/openfile"
        });
        await file.persist();
        data.inputFileId = file.fileId.toString();
    });

    it("POST afc request", async () => {
const getCreditsStub = Sinon.stub(Credit, "getUserCredits").callsFake( async (userId) => {
    return 250;
});

Sinon.stub(OrganizationModel, "getUniversityByCode").callsFake( async (organizationCode) => {
    return OrganizationModelStubs.winterfellUniversity;
});

const mockedRequest = httpMocks.createRequest({
method: "POST",
body: data
});
const mockedResponse = httpMocks.createResponse({
    locals: {
        user: {
            id: requester.id,
            organizationCode: "world"
        }
    }
});
await AFCController.post(mockedRequest, mockedResponse);
console.log("response: %o", mockedResponse._getJSONData())
expect(mockedResponse._getJSONData().code).to.be.equal(200);

getCreditsStub.restore();
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
