import { expect, should } from "chai";
import { AfcModel } from "../../domain/AfcModel";
import {
    AFCRequestOutputFormat,
    AFCRequestStatus,
    AFCTriggerer,
    DocType,
} from "../../domain/AfcModel/AFCConstants";
import db from "../dbHandler";

describe("AFC Model Unit Tests", function () {
    const documentName = "djikstraalgoimg.png";
    let afcReq: AfcModel | null;
    before(async () => {
        await db.createConnection();
    });
    it("should create new AFC Request", async function () {
        afcReq = await AfcModel.createAndPersist({
            docType: DocType.NONMATH,
            documentName,
            inputFileId: "60279c1805cd7425a22e77fd",
            outputFormat: AFCRequestOutputFormat.TEXT,
            triggeredBy: AFCTriggerer.USER,
            userId: "5f858d655c75a02b6c93d977",
        });
        expect(afcReq.documentName).equal(documentName);
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
        await AfcModel.saveReview(afcReq.afcRequestId, {
            ratings: 3,
            text: "The service performed well and produced perfect output",
            serviceRequestId: afcReq.afcRequestId,
        });
    });
    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
