import mongoose from 'mongoose';
import EscalationModel from '../domain/EscalationModel';

const escalationSchema = new mongoose.Schema({
    escalatorId: {type: mongoose.Types.ObjectId, ref: 'User'},
    resolverId: {type: mongoose.Types.ObjectId, ref: 'User'},
    serviceRequestId: {type: mongoose.Types.ObjectId, ref: 'AFC'},
    escalationForService: {type: String, enum: ['afc', 'vc']},
    sourceFileId: {type: mongoose.Types.ObjectId, ref: 'File', required: true},
    aiServiceConvertedFileURL: {type: String},
    escalationForResult: {type: String},
    remediatedFileURL: {type: String},
    pageRanges: [String],
    videoPortions: [String]
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
});

export default mongoose.model<EscalationModel & mongoose.Document>('Escalation', escalationSchema);
