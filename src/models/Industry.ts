import mongoose from 'mongoose';
import IndustryModel from '../domain/IndustryModel';

const IndustrySchema = new mongoose.Schema({
    name: {type: String}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
});
export default mongoose.model<IndustryModel & mongoose.Document>('Industry', IndustrySchema);
