/**
 * Define Ledger Model
 */

import { ILedger } from '../interfaces/models/ledger';
import mongoose from 'mongoose';

export interface ILedgerModel extends ILedger, mongoose.Document {}

// Define Ledger Schema
export const LedgerSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        reason: { type: String },
        credited: { type: Number, index: true },
        debited: { type: Number, index: true }
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true
    }
);

const Ledger = mongoose.model<ILedgerModel>('Ledger', LedgerSchema);

export default Ledger;
