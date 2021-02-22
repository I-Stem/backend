import mongoose from "mongoose";
import { type } from "os";
import {MentorshipModel} from "../domain/Community/MentorshipModel";
import {
    ConnectOften,
    SignupAs,
} from "../domain/Community/MentorshipModel/MentorshipConstants";

const MentorshipSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        industry: { type: String },
        currentPosition: { type: String },
        isPWD: { type: Boolean },
        associatedDisabilities: [{ type: String }],
        signupAs: {
            type: String,
            enum: [SignupAs.MENTOR, SignupAs.MENTEE, SignupAs.BOTH],
        },
        learnSkills: { type: String },
        questionToMentor: { type: String },
        anythingElse: { type: String },
        menteeAgreement: { type: Boolean },
        mentorSkills: { type: String },
        connectOften: {
            type: String,
            enum: [
                ConnectOften.ONCE_EVERY_MONTH,
                ConnectOften.ONCE_EVERY_OTHER_WEEK,
                ConnectOften.ONCE_EVERY_3_MONTHS,
                ConnectOften.ONCE_EVERY_WEEK,
            ],
        },
        questionToMentee: { type: String },
        pauseMentorship: { type: Boolean },
        resumeMentorship: { type: Boolean },
        cancelMenteeship: { type: Boolean },
        mentorshipStatus: [{ status: String, actionAt: Date }],
        contactNumber: { type: String },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);
export default mongoose.model<MentorshipModel & mongoose.Document>(
    "Mentorship",
    MentorshipSchema
);
