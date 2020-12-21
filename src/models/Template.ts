/**
 * Define Template model
 *
 */

const bcrypt = require('bcrypt');

import { ITemplate } from '../interfaces/models/template';
import mongoose from 'mongoose';

// Create the model schema & register your custom methods here
export interface ITemplateModel extends ITemplate, mongoose.Document {}

// Define the Template Schema
export const TemplateSchema = new mongoose.Schema(
    {
        name: String,
        body: String,
        subject: String,
        type: { type: Number, required: true },
        link: String,
        text: String,
        isEmail: Boolean,
        isDashboard: Boolean
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
        strict: false
    }
);

const Template = mongoose.model<ITemplateModel>('Template', TemplateSchema);

export default Template;
