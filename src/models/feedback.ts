import mongoose from 'mongoose';
import FeedbackModel from '../domain/FeedbackModel';

const FeedbackSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    feedbackFor : {type: String, enum: ['afc_service', 'afc_service_escalation', 'vc_service', 'vc_service_escalation', 'vc_custom_service', 'generic']},
    rating: {type: Number, min: 1, max: 5},
    purpose: {type: String},
    likes: {type: String},
    dislikes: {type: String},
    creditsRequested: {type: Number}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
}
);

export default mongoose.model<FeedbackModel & mongoose.Document>('Feedback', FeedbackSchema);
