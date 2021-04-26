import { VCLanguageModelType } from "../../../domain/VCProcess/VCProcessConstants";
import {VCProcess} from "../../../domain/VCProcess";
import {FileModelStubs} from "./FileModelStubs";

export const VCProcessStubs = {
    vcProcess: new VCProcess({
        insightAPIVersion: "2021.04.21",
        inputFileHash: FileModelStubs.GOT.hash,
        inputFileId: "defined at runtime",
        languageModelId: undefined,
        languageModelType: VCLanguageModelType.STANDARD,
        externalVideoId: "processing_id"
    })
}