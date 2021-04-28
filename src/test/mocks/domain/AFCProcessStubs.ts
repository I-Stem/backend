import { DocType } from "../../../domain/AfcModel/AFCConstants";
import {AFCProcess} from "../../../domain/AFCProcess";
import { FileModelStubs } from "./FileModelStubs";

export const AFCProcessStubs = {
    afcProcess: new AFCProcess({
        inputFileHash: FileModelStubs.SongOfIceAndFire.hash,
        ocrType: DocType.NONMATH,
        ocrVersion: "2021.04.04",
        inputFileId: FileModelStubs.SongOfIceAndFire.fileId
    })
}