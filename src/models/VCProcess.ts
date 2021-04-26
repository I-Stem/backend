import mongoose from "mongoose";
import { VCRequestStatus } from "../domain/VcModel/VCConstants";
import {VCProcess} from "../domain/VCProcess";
import {VCLanguageModelType} from "../domain/VCProcess/VCProcessConstants";

const VCProcessSchema = new mongoose.Schema({
    inputFileHash: {type: String, required:true, index: true},
    inputFileId: {type: mongoose.Schema.Types.ObjectId, ref: "File"},
    inputFileLink : {type: String},
    insightAPIVersion: {type: String, required: true, index: true},
    videoLength : {type: Number},
    externalVideoId: {type: String, unique: true},
    insightWaitingQueue: [{type: mongoose.Schema.Types.ObjectId, ref: "VideoCaptioning"}],
    languageModelType: {
        type: String, 
        enum: [VCLanguageModelType.STANDARD, VCLanguageModelType.CUSTOM]
    },
    languageModelId :  {type: mongoose.Schema.Types.ObjectId, ref: "MLModel", index: true},
    outputFiles: [{
insightType : {type: String},
outputFormat: {type: String},
file:{
    container: {type: String},
fileKey: {type: String},
fileId: {type: String}
    }
    }],
    expiryTime: {type: Date},
    status: {
        type: String,
        enum: [
            VCRequestStatus.INITIATED,
            VCRequestStatus.INDEXING_REQUESTED,
            VCRequestStatus.INDEXING_REQUEST_FAILED,
            VCRequestStatus.INDEXING_SKIPPED,
            VCRequestStatus.CALLBACK_RECEIVED,
            VCRequestStatus.INDEXING_API_FAILED,
            VCRequestStatus.INSIGHT_REQUESTED,
            VCRequestStatus.INSIGHT_FAILED,
            VCRequestStatus.COMPLETED,
            VCRequestStatus.ESCALATION_REQUESTED,
            VCRequestStatus.ESCALATION_RESOLVED, 
            VCRequestStatus.RETRY_REQUESTED,
            VCRequestStatus.RESOLVED_FILE_USED
        ]
    },
    statusLog: [{
        status: {type: String},
        actionAt: {type: Date}
}],
}, 
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
}
);

export default mongoose.model<VCProcess & mongoose.Document>("VCProcess", VCProcessSchema);