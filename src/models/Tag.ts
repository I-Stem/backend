/**
 * Define model for tag
 *
 */

import { ITag } from '../interfaces/models/tag';
import mongoose from 'mongoose';

export interface ITagModel extends ITag, mongoose.Document {}

export const ITagSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String }
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true
    }
);

ITagSchema.index({ userId: 1, name: 1 }, { unique: true });

const Tag = mongoose.model<ITagModel>('Tag', ITagSchema);

export default Tag;
