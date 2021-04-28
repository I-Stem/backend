import { AFCRequestOutputFormat, AFCTriggerer, DocType } from "../../../domain/AfcModel/AFCConstants";
import {AfcModel} from "../../../domain/AfcModel";
import { FileModelStubs } from "./FileModelStubs";
import { UserModelStubs } from "./UserModelStubs";

export const AfcModelStubs = {
    afcRequest : new AfcModel({
        userId: UserModelStubs.JohnSnow.userId,
        organizationCode: UserModelStubs.JohnSnow.organizationCode,
        docType: DocType.NONMATH,
        documentName: FileModelStubs.SongOfIceAndFire.name,
        triggeredBy: AFCTriggerer.USER,
        outputFormat: AFCRequestOutputFormat.TEXT,
        inputFileId: FileModelStubs.SongOfIceAndFire.fileId,
        pageCount: FileModelStubs.SongOfIceAndFire.pages
    })
}