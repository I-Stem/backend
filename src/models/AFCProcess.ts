import mongoose from "mongoose";
import { AFCProcess } from "../domain/AFCProcess";
const AFCProcessSchema = new mongoose.Schema({
inputFileHash: {type:String, required:true, index: true},
inputFileId: {type:String, required:true, index: true},
pageCount: {type: Number},
ocrType: {type: String, required: true, index: true},
ocrVersion: {type: String, required : true, index: true},
ocrWaitingQueue: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AFC"
}],
expiryTime: { type: Date, index: true},
ocrJSONFile: {
    container: {type: String},
    fileKey: {type: String}
},
outputFiles: {
    type: Map,
    of: {
        container: {type: String},
fileKey: {type: String},
fileId: {type: String}
    }
},
status: {type: String},
statusLog: [{
status: { type: String},
actionAt: {type: Date}
}],
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true,
}
);

export default mongoose.model<AFCProcess & mongoose.Document>("AFCProcess", AFCProcessSchema);