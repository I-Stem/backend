import mongoose from 'mongoose';
import MLModelModel from '../domain/MLModelModel';

const MLModelSchema = new mongoose.Schema({
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String, required: true },
    trainedModelId: {type : String},
    trainings: [{
        status: {type: String, enum: ['created', 'afc_initiated', 'trained', 'training_failed']},
        dataAfcRequests: {type: Map, of: String}
    }]
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
}
);

export default mongoose.model<MLModelModel & mongoose.Document>('MlModel', MLModelSchema);
