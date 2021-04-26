import { HandleAccessibilityRequests } from "../../../domain/organization/OrganizationConstants";
import { CaptionOutputFormat, VCRequestStatus, VideoExtractionType } from "../../../domain/VcModel/VCConstants";
import {VcModel} from "../../../domain/VcModel";
import { FileModelStubs } from "./FileModelStubs";
import {OrganizationModelStubs} from "./OrganizationModelStubs";

export const VCModelStubs = {
    vcRequest: new VcModel({
        userId: "defined at runtime",
        organizationCode: OrganizationModelStubs.winterfellUniversity.code,
        documentName: "video",
        requestType: VideoExtractionType.CAPTION,
        outputFormat: CaptionOutputFormat.SRT,
        resultType: HandleAccessibilityRequests.AUTO,
        inputFileId: "defined at runtime",
        inputFileLink: FileModelStubs.GOT.inputURL,
        videoLength: FileModelStubs.GOT.videoLength,
status: VCRequestStatus.INITIATED
    })
}