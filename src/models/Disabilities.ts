import mongoose from 'mongoose';
import DisabilitiesModel from '../domain/DisabilitiesModel';

const DisabilitiesSchema = new mongoose.Schema({
    name: {type: String}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
});
export default mongoose.model<DisabilitiesModel & mongoose.Document>('Disabilities', DisabilitiesSchema);
