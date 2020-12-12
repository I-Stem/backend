/**
 * Define model for file
 *
 */

import FileModel from '../domain/FileModel';
import mongoose from 'mongoose';
import { DocType } from '../domain/AfcModel';

export const FileSchema = new mongoose.Schema(
    {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        name: { type: String, index: true },
        hash: { type: String, unique: true },
        size: { type: Number },
        inputURL: { type: String },
        json: { type: Object },
        pages: { type: Number },
        videoLength: {type: Number},
        externalVideoId: {
            type: String,
            index: true
        },
        outputFiles: { type: Map,
         of: String},
        waitingQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: ['AFC', 'VideoCaptioning']}],
        OCRVersion: { type: String },
        ocrFileURL: { type: String },
        mathOcrFileUrl: { type: String }
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true
    }
);

const File = mongoose.model<FileModel & mongoose.Document>('File', FileSchema);

export default File;
