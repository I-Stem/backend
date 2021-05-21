import { AFCRequestOutputFormat } from "../../../domain/AfcModel/AFCConstants";
import { AIServiceCategory, EscalationStatus } from "../../../domain/EscalationModel/EscalationConstants";
import {EscalationModel} from "../../../domain/EscalationModel";
import {FileModelStubs} from "./FileModelStubs";

export const EscalationModelStubs = {
    remediationProcess: new EscalationModel({
        waitingRequests:[],
        status: EscalationStatus.UNASSIGNED,
        sourceFileHash: FileModelStubs.SongOfIceAndFire.hash,
        pageRanges:["2-5,6-18"],
        escalationForService: AIServiceCategory.AFC,
        escalationForResult: AFCRequestOutputFormat.HTML,
        sourceFileId: "defined at runtime",
        serviceRequestId: "defined at runtime",
        escalatorOrganization: "amazing"
    })
}