/**
 * Define model for VC(Video Captioning)
 *
 */

import { IVC } from "../interfaces/models/vc";
import mongoose from "mongoose";
import ReviewSchema from "./Review";
import {VcModel} from "../domain/VcModel";
import {
    VCRequestStatus,
    VideoExtractionType,
    CaptionOutputFormat,
} from "../domain/VcModel/VCConstants";
import { HandleAccessibilityRequests } from "../domain/organization/OrganizationConstants";

const mongooseFuzzySearching = require("mongoose-fuzzy-searching");

export interface IVCDocuement extends IVC, mongoose.Document {}

export interface IVCModel extends mongoose.Model<IVCDocuement> {
    _update: any;
    fuzzySearch(arg: any, query: any): any;
}

export const VCSchema = new mongoose.Schema(
    {
        correlationId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        organizationCode: { type: String },
        associatedProcessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VCProccess",
            index: true,
        },
        escalationId: { type: String },
        requestType: {
            type: String,
            enum: [
                VideoExtractionType.CAPTION,
                VideoExtractionType.OCR,
                VideoExtractionType.OCR_CAPTION,
            ],
        },
        inputFileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            index: true,
        },
        inputFileLink: { type: String },
        outputURL: { type: String },
        outputFile: {
            container: { type: String },
            fileKey: { type: String },
            fileId: { type: mongoose.Schema.Types.ObjectId, ref: "file" },
        },
        modelName: { type: String, default: "standard-@" },
        documentName: { type: String },
        videoLength: { type: Number }, // seconds
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
                VCRequestStatus.RESOLVED_FILE_USED,
            ],
            index: true,
        },
        statusLog: [{ status: String, actionAt: Date }],
        tag: { type: String },
        review: ReviewSchema,
        reviews: [ReviewSchema],
        outputFormat: {
            type: String,
            default: CaptionOutputFormat.TXT,
            enum: [
                CaptionOutputFormat.SRT,
                CaptionOutputFormat.TXT,
                CaptionOutputFormat.ZIP,
            ],
        },
        expiryTime: { type: Date },
        otherRequests: { type: String },
        resultType: {
            type: String,
            enum: [
                HandleAccessibilityRequests.AUTO,
                HandleAccessibilityRequests.MANUAL,
            ],
        },
        secsForRemediation: {
            type: String
        }
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

/*
VCSchema.pre<IVCModel>(`findOneAndUpdate`, function(_next) {
    this._update['$push'] = {reviews: this._update.review};

    console.log('pre update');
    return _next();
});
*/
VCSchema.plugin(mongooseFuzzySearching, { fields: ["documentName", "tag"] });

const VideoCaptioning = mongoose.model<VcModel & mongoose.Document>(
    "VideoCaptioning",
    VCSchema
);

export default VideoCaptioning;

