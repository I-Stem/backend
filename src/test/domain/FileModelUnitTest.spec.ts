import { DocType } from "../../domain/AfcModel/AFCConstants";
import FileModel from "../../domain/FileModel";
import db from "../dbHandler";

describe("Unit Tests for File Model", () => {
    const documentName = "djikstraalgoimg.png";
    const inputURL =
        "https://s3.us-west-2.amazonaws.com/inclusivestem.org/files/1f1ffa6575aef03c5e86fa0efabc1f0e/inputFile-djikstraalgoimg.png";
    const hash = "1f1ffa6575aef03c5e86fa0efabc1f0e";
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
    describe("Get file by hash and clear waiting queue", function () {
        let file: FileModel | null;
        it("should get file by hash", async function () {
            file = await FileModel.getFileByHash(hash);
        });
        it("should clear waiting queue for NON-MATH doctype", async function () {
            await file.clearWaitingQueue(DocType.NONMATH);
        });
        it("should clear waiting queue for MATH doctype", async function () {
            await file.clearWaitingQueue(DocType.MATH);
        });
    });

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });
});
