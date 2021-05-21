import { expect } from "chai";
import { Readable, Stream } from "stream";
import { fileURLToPath } from "url";
import { DocType } from "../../domain/AfcModel/AFCConstants";
import FileModel from "../../domain/FileModel";
import { FileProcessAssociations } from "../../domain/FileModel/FileConstants";
import { UniversityRoles } from "../../domain/organization/OrganizationConstants";
import { UserType } from "../../domain/user/UserConstants";
import db from "../dbHandler";
import {FileModelStubs} from "../mocks/domain/FileModelStubs";
import { UserModelStubs } from "../mocks/domain/UserModelStubs";

describe("Unit Tests for File Model", () => {
const documentFile = FileModelStubs.SongOfIceAndFire;
const mediaFile = FileModelStubs.GOT;
const user1 = UserModelStubs.JohnSnow;
const user2 = UserModelStubs.AryaStark;

    before(async () => {
        await db.createConnection();
        await user1.persist();
        await user2.persist();
        documentFile.userContexts[0].userId = user1.userId;
    });

    it("should create a new file document", async () => {
        await documentFile.persist();
        expect(documentFile.fileId.toString().length).to.be.above(20);
    });

    describe("File Model", function () {
        let file: FileModel | null;
        it("should get file by hash", async function () {
            const file = await FileModel.getFileByHash(documentFile.hash);
expect(file.name).to.be.equal(documentFile.name);
        });

        it("should retrieve file by id", async function () {
            const fileDoc = await FileModel.getFileById(documentFile.fileId);
            expect(fileDoc.name).equals(documentFile.name);
        });
    });

    it("should set filekey", async function() {
        await documentFile.setFileLocation("galaxy/milkyway");
        expect(documentFile.fileKey).to.be.equal("galaxy/milkyway");
    });

    it("should return true for file association with user", async function() {
        const result = await documentFile.isAssociatedWithUser(user1.userId);
        expect(result).to.be.equal(true);
    });

    it("should correctly associate file with user", async function() {
        const result = await documentFile.associateFileWithUser(user2.userId, FileProcessAssociations.AFC_REMEDIATION, user2.organizationCode);
        expect(await documentFile.isAssociatedWithUser(user2.userId)).to.be.equal(true);
    });

    it("should silently fail on finding no file with given hash", async function() {
        const file = await FileModel.findFileByHash("over");

        expect(file).to.be.equal(null);
    });

    it("should throw error on finding no file with given hash", async function() {
        try {
        const file = await FileModel.getFileByHash("over");
        expect(false).to.be.equal(true);
        } catch(error) {
        expect(true).to.be.equal(true);
        }
    });

    it("should silently fail on finding no file with given id", async function() {
        const fileId = documentFile.fileId.toString().substr(0, 20) + "bcdf";
        const file = await FileModel.findFileById(fileId);
        expect(file).to.be.equal(null);
    });

    it("should throw error on finding no file with given id", async function() {
        try {
        const file = await FileModel.getFileById("over");
        expect(false).to.be.equal(true);
        } catch(error) {
        expect(true).to.be.equal(true);
        }
    });

    it("should name default name of file as per process association", async function () {
        const name = FileModel.getFileNameByProcessAssociationType("wonderful.docx", FileProcessAssociations.AFC_INPUT);
        expect(name).to.be.equal("afcInputFile.docx");
    });

    it("should check association with an organization", async function() {
        const result = documentFile.isAssociatedWithOrganizationCode("none");
        expect(result).to.be.equal(false);
    });

it("should check access rights for elevated users", async function() {
const result1 = FileModel.isFileAccessibleToElevatedUser(UserType.UNIVERSITY, UniversityRoles.STAFF);
expect(result1).to.be.equal(false);

const result2 = FileModel.isFileAccessibleToElevatedUser(UserType.I_STEM, UniversityRoles.REMEDIATOR);
expect(result2).to.be.equal(true);
});

it("should correctly determine access rights for organization elevated user", async function() {
    const result1 = FileModel.isFileAccessibleToOrganizationElevatedUserRole(UserType.UNIVERSITY, UniversityRoles.STAFF, "org1", "org2");
    expect(result1).to.be.equal(false);

    const result2 = FileModel.isFileAccessibleToOrganizationElevatedUserRole(UserType.UNIVERSITY, UniversityRoles.STAFF, "org1", "org1");
    expect(result2).to.be.equal(true);

    const result3 = FileModel.isFileAccessibleToOrganizationElevatedUserRole(UserType.UNIVERSITY, UniversityRoles.STUDENT, "org1", "org1");
    expect(result3).to.be.equal(false);
});

it("should determine access rights for org users", async function() {
    const result1 =documentFile.isFileAccessibleToOrganizationElevatedUserRole(user1.userType, user1.role, user1.organizationCode);
        expect(result1).to.be.equal(false);
        
    const result2 =documentFile.isFileAccessibleToOrganizationElevatedUserRole(user1.userType, UniversityRoles.STAFF, "unknown");
    expect(result2).to.be.equal(false);

    const result3 =documentFile.isFileAccessibleToOrganizationElevatedUserRole(user1.userType, UniversityRoles.STAFF, user1.organizationCode);
    expect(result3).to.be.equal(true);

});

    after(async () => {
        await db.cleanup();
        await db.closeConnection();
    });

    it("should successfully read the filedata", async function() {
        const readable = new Readable();
        readable.push("hello there");
        readable.push(null);
        const result = await documentFile.setFileMetadata(readable, "application/string");
        expect(result.toString()).to.equal("hello there");
    })
});
