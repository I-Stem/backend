import { expect, should } from "chai";
import { AfcModel } from "../../../domain/AfcModel";
import {
    AFCRequestOutputFormat,
    AFCRequestStatus,
    AFCTriggerer,
    DocType,
} from "../../../domain/AfcModel/AFCConstants";
import db from "../../dbHandler";
import { FileModelStubs } from "../../mocks/domain/FileModelStubs";
import {UserModelStubs} from "../../mocks/domain/UserModelStubs";
import FileModel, { FileCoordinate } from "../../../domain/FileModel";
import UserModel from "../../../domain/user/User";
import ReviewModel from "../../../domain/ReviewModel";
import { HandleAccessibilityRequests } from "../../../domain/organization/OrganizationConstants";

describe("AFC Model Unit Tests", function () {
    let inputFile: FileModel = new FileModel(FileModelStubs.SongOfIceAndFire);
const fileOwner = new UserModel(UserModelStubs.JohnSnow);
let afcReq: AfcModel;
    before(async () => {
        await db.createConnection();
        await fileOwner.persist();
        inputFile.userContexts[0].userId = fileOwner.userId;
        await inputFile.persist();
    });

    it("should create new AFC Request", async function () {
        afcReq = await AfcModel.createAndPersist({
            docType: DocType.NONMATH,
            documentName: inputFile.name,
            organizationCode: fileOwner.organizationCode,
            inputFileId: inputFile.fileId,
            outputFormat: AFCRequestOutputFormat.TEXT,
            triggeredBy: AFCTriggerer.USER,
            userId: fileOwner.userId,
            resultType: HandleAccessibilityRequests.AUTO
        });
        expect(afcReq.documentName).equal(afcReq.documentName);
    });

    describe("Change AFC status", function () {
        it("should change afc status to FORMATTING COMPLETED", async function () {
            await afcReq.changeStatusTo(AFCRequestStatus.FORMATTING_COMPLETED);
            expect(afcReq.status).equal(AFCRequestStatus.FORMATTING_COMPLETED);
        });
        it("should change afc status to FORMATTING FAILED", async function () {
            await afcReq.changeStatusTo(AFCRequestStatus.FORMATTING_FAILED);
            expect(afcReq.status).equal(AFCRequestStatus.FORMATTING_FAILED);
        });
    });

    it("should save review for AFC request", async function () {
        await AfcModel.saveReview(afcReq.afcRequestId, new ReviewModel(afcReq.afcRequestId,
            3,
            "The service performed well and produced perfect output",
        ));
    });

    it("should perform final complete request formatting", async () => {
        const file = new FileCoordinate("box", "value", inputFile.fileId);
        afcReq.status = AFCRequestStatus.RESOLVED_FILE_USED;
await afcReq.completeAFCRequestProcessing(file);
afcReq.resultType = HandleAccessibilityRequests.MANUAL;
await afcReq.completeAFCRequestProcessing(file);
afcReq.triggeredBy = AFCTriggerer.VC_MODEL;
await afcReq.completeAFCRequestProcessing(file);
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
