import mongoose from 'mongoose';
import { type } from 'os';
import MentorshipModel from '../domain/MentorshipModel';

export const enum ConnectOftenEnum {
    ONCE_EVERY_WEEK = 'once_every_week',
    ONCE_EVERY_OTHER_WEEK = 'once_every_other_week',
    ONCE_EVERY_MONTH = 'once_every_month',
    ONCE_EVERY_THREE_MONTH = 'once_every_3_months'
}

const MentorshipSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    industry: {type: String},
    currentPosition: {type: String},
    isPWD: {type: Boolean},
    associatedDisabilities: [{type: String}],
    signupAs: {type: String, enum: ['mentor', 'mentee', 'both', 'none']},
    learnSkills: {type: String},
    questionToMentor: {type: String},
    anythingElse: {type: String},
    menteeAgreement: {type: Boolean},
    mentorSkills: {type: String},
    connectOften: {type: String, enum: [ConnectOftenEnum.ONCE_EVERY_MONTH, ConnectOftenEnum.ONCE_EVERY_OTHER_WEEK, ConnectOftenEnum.ONCE_EVERY_THREE_MONTH, ConnectOftenEnum.ONCE_EVERY_WEEK]},
    questionToMentee: {type: String},
    pauseMentorship: {type: Boolean},
    resumeMentorship: {type: Boolean},
    cancelMenteeship: {type: Boolean},
    mentorshipStatus: [{status: String, actionAt: Date}],
    contactNumber: {type: String}
},
{
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    timestamps: true
}
);
export default mongoose.model<MentorshipModel & mongoose.Document>('Mentorship', MentorshipSchema);
