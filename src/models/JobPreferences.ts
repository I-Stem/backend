import mongoose from 'mongoose';
import { type } from 'os';
import JobPreferencesModel from '../domain/JobPreferencesModel';

const JobPreferencesSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    seekingJob: {type: Boolean},
    natureOfJob: {type: String, enum: ['internship', 'full_time', 'both']},
    industry: {type: String},
    idealPosition: {type: String},
    highestEducation: {type: String, enum: ['10th_std', '12th_std', 'graduate_degree', 'post_graduate_degree']},
    highestDegree: {type: String},
    major: {type: String},
    workExperience: {type: String},
    associatedDisabilities: [{type: String}],
    currentPlace: {type: String},
    canRelocate: {type: Boolean},
    linkedIn: {type: String},
    portfolioLink: {type: String},
    resumeLink: {type: String},
    needCareerHelp: {type: Boolean},
    inputFileId: {type: String}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
}
);
export default mongoose.model<JobPreferencesModel & mongoose.Document>('JobPreferences', JobPreferencesSchema);
