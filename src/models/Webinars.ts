import mongoose from 'mongoose';
import WebinarsModel from '../domain/WebinarsModel';

const WebinarsSchema = new mongoose.Schema({
    resourceTitle: {type: String},
    resourceDescription: {type: String},
    resourceUrl: {type: String}

},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
});
export default mongoose.model<WebinarsModel & mongoose.Document>('Webinars', WebinarsSchema);
