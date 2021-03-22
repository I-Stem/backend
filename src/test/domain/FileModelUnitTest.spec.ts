import { expect } from "chai";
import { DocType } from "../../domain/AfcModel/AFCConstants";
import FileModel from "../../domain/FileModel";
import db from "../dbHandler";

describe("Unit Tests for File Model", () => {
    const documentName = "djikstraalgoimg.png";
    const hash = "1f1ffa6575aef03c5e86fa0efabc1f0e";
    const inputURL = `https://s3.us-west-2.amazonaws.com/inclusivestem.org/files/${hash}/inputFile-${documentName}`;
    before(async () => {
        await db.createConnection();
    });
    it("should create a new file document", async () => {
        await new FileModel({
            hash,
            inputURL,
            name: documentName,
            users: ["5f858d655c75a02b6c93d977"],
        }).persist();
    });
    describe("File Model", function () {
        let file: FileModel | null;
        it("should get file by hash", async function () {
            file = await FileModel.getFileByHash(hash);
        });
        it("should add service request to MATH waiting queue", async function () {
            await file.addRequestToWaitingQueue(
                "60279c1805cd7425a22e77fd",
                DocType.MATH
            );
        });
        it("should add service request to NON-MATH waiting queue", async function () {
            await file.addRequestToWaitingQueue(
                "60279c1805cd7425a22e77fd",
                DocType.NONMATH
            );
        });
        it("should clear waiting queue for NON-MATH doctype", async function () {
            await file.clearWaitingQueue(DocType.NONMATH);
        });
        it("should clear waiting queue for MATH doctype", async function () {
            await file.clearWaitingQueue(DocType.MATH);
        });
        it("should retrieve file by id", async function () {
            const fileDoc = await FileModel.getFileById(file.fileId);
            expect(fileDoc.name).equals(documentName);
        });
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
