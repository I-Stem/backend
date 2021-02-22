import mongoose from "mongoose";
import {EscalationModel} from "../domain/EscalationModel";
import {
    AIServiceCategory,
    EscalationStatus,
} from "../domain/EscalationModel/EscalationConstants";

/**
 * Escalation Model Schema
 */
const escalationSchema = new mongoose.Schema(
    {
        escalatorId: { type: mongoose.Types.ObjectId, ref: "User" },
        resolverId: { type: mongoose.Types.ObjectId, ref: "User" },
        serviceRequestId: {
            type: mongoose.Types.ObjectId,
            ref: "AFC",
        },
        escalationForService: {
            type: String,
            enum: [AIServiceCategory.AFC, AIServiceCategory.VC],
        },
        sourceFileId: {
            type: mongoose.Types.ObjectId,
            ref: "File",
            required: true,
        },
        aiServiceConvertedFileURL: { type: String },
        escalationForResult: { type: String },
        remediatedFileURL: { type: String },
        pageRanges: [String],
        videoPortions: [String],
        escalatorOrganization: { type: String },
        description: { type: String },
        status: {
            type: String,
            enum: [
                EscalationStatus.INPROGRESS,
                EscalationStatus.RESOLVED,
                EscalationStatus.UNASSIGNED,
            ],
        },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: [
                        EscalationStatus.INPROGRESS,
                        EscalationStatus.RESOLVED,
                        EscalationStatus.UNASSIGNED,
                    ],
                },
                actionAt: Date,
            },
        ],
        docOutputFileUrl: { type: String },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

export default mongoose.model<EscalationModel & mongoose.Document>(
    "Escalation",
    escalationSchema
);
