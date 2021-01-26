import { string } from "@hapi/joi";
import mongoose from "mongoose";
import { type } from "os";
import JobPreferencesModel, {
    HighestQualification,
    HiringActionLog,
    JobNature,
} from "../domain/Community/JobPreferencesModel";

const JobPreferencesSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String },
        seekingJob: { type: Boolean },
        natureOfJob: {
            type: String,
            enum: [JobNature.BOTH, JobNature.FULL_TIME, JobNature.INTERNSHIP],
        },
        industry: { type: String },
        idealPosition: { type: String },
        highestEducation: {
            type: String,
            enum: [
                HighestQualification.GRADUATE_DEGREE,
                HighestQualification.POST_GRADUATE_DEGREE,
                HighestQualification.TENTH_STD,
                HighestQualification.TWELFTH_STD
            ],
        },
        highestDegree: { type: String },
        major: { type: String },
        workExperience: { type: String },
        totalExperience: { type: String },
        associatedDisabilities: [{ type: String }],
        currentPlace: { type: String },
        canRelocate: { type: Boolean },
        linkedIn: { type: String },
        portfolioLink: { type: String },
        resumeLink: { type: String },
        needCareerHelp: { type: Boolean },
        inputFileId: { type: String },
        interested: [{ type: String }],
        ignored: [{ type: String }],
        actionLog: [],
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);
export default mongoose.model<JobPreferencesModel & mongoose.Document>(
    "JobPreferences",
    JobPreferencesSchema
);
