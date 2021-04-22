/**
 * Define model for file
 *
 */

import FileModel from "../domain/FileModel";
import mongoose from "mongoose";
import { DocType } from "../domain/AfcModel/AFCConstants";
import { FileProcessAssociations } from "../domain/FileModel/FileConstants";

const processAssociations = Object.keys(FileProcessAssociations).map(key => FileProcessAssociations[key]);

export const FileSchema = new mongoose.Schema(
    {
        userContexts: [{ 
            userId: {
                type: mongoose.Schema.Types.ObjectId, 
                ref: "User" 
            },
            processAssociation: {
                type: String,
                required: true,
                enum: processAssociations
            },
            organizationCode: {
                type: String,
                required :true
            },
            associatedAt: {
                type: Date
            }
        }],
        name: { type: String, index: true },
        hash: { type: String, unique: true },
        size: { type: Number },
        inputURL: { type: String },
        mimetype: {type: String},
        pages: { type: Number },
        isRemediated: {type: Boolean},
        videoLength: { type: Number },
        externalVideoId: {
            type: String,
            index: true,
        },
        outputFiles: { type: Map,
         of: String},

        container: {type: String, required: true},
        fileKey: {type: String},
        ocrWaitingQueue: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: ["AFC", "VideoCaptioning"],
            },
        ],
        OCRVersion: { type: String },
        ocrFileURL: { type: String },
        mathOcrFileUrl: { type: String },
        mathOcrWaitingQueue: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: ["AFC", "VideoCaptioning"],
            },
        ],
        remediatedFileName: { type: String }
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

const File = mongoose.model<FileModel & mongoose.Document>("File", FileSchema);

export default File;

