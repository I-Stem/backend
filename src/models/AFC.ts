/**
 * Define model for AFC(Alternate format conversion)
 *
 */

import { IAFC } from "../interfaces/models/afc";
import mongoose from "mongoose";

import ReviewSchema from "./Review";
import AfcModel, {
    AFCRequestOutputFormat,
    AFCRequestStatus,
    DocType,
} from "../domain/AfcModel";
import { string } from "@hapi/joi";

const mongooseFuzzySearching = require("mongoose-fuzzy-searching");

/*
export interface IAFCModel extends mongoose.Model<mongoose.Document, AfcModel> {
    fuzzySearch(arg: any, query: any): any;
}
*/

const allowedAFCRequestStatuses = [
    AFCRequestStatus.REQUEST_INITIATED,
    AFCRequestStatus.OCR_REQUESTED,
    AFCRequestStatus.OCR_REQUEST_ACCEPTED,
    AFCRequestStatus.OCR_REQUEST_REJECTED,
    AFCRequestStatus.OCR_COMPLETED,
    AFCRequestStatus.OCR_FAILED,
    AFCRequestStatus.OCR_SKIPPED,
    AFCRequestStatus.FORMATTING_REQUESTED,
    AFCRequestStatus.FORMATTING_COMPLETED,
    AFCRequestStatus.FORMATTING_FAILED,
    AFCRequestStatus.ESCALATION_REQUESTED,
    AFCRequestStatus.ESCALATION_RESOLVED,
    AFCRequestStatus.RETRY_REQUESTED,
];

export const AFCSchema = new mongoose.Schema(
    {
        // correlationId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        triggeredBy: {
            type: String,
            enum: ["user", "vc_model"],
            required: true,
        },
        triggeringCaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MlModel",
        },
        inputFileId: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
        outputURL: { type: String },
        documentName: { type: String },
        pageCount: { type: Number },
        docType: { type: String, enum: ["MATH", "NONMATH"] },
        status: {
            type: String,
            enum: allowedAFCRequestStatuses,
            index: true,
        },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: allowedAFCRequestStatuses,
                    index: true,
                },
                actionAt: Date,
            },
        ],
        outputFormat: {
            type: String,
            enum: [
                AFCRequestOutputFormat.WORD,
                AFCRequestOutputFormat.HTML,
                AFCRequestOutputFormat.PDF,
                AFCRequestOutputFormat.MP3,
                AFCRequestOutputFormat.TEXT,
            ],
            index: true,
        }, // 1 - word, 2 - xhtml, 3 - text, 4 - pdf, 5 - mp3
        tag: { type: String, index: true },
        escalatedPageRange: { type: String },
        review: ReviewSchema,
        reviews: [ReviewSchema],
        inputFileLink: { type: String },
        expiryTime: { type: Date },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

/*
AFCSchema.virtual('tag', {
    ref: 'Tag',
    localField: 'tagId',
    foreignField: '_id',
    justOne: true
});
*/
/*
AFCSchema.pre(`findOneAndUpdate`, function(_next) {
    this._update['$push'] = {reviews: this._update.review};

    console.log('pre update');
    return _next();
});
*/

AFCSchema.plugin(mongooseFuzzySearching, { fields: ["documentName", "tag"] });

const AFC = mongoose.model<AfcModel & mongoose.Document>("AFC", AFCSchema);

export default AFC;
