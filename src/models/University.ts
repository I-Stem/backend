import mongoose from "mongoose";
import {
    University,
    DomainAccess,
    EscalationsHandledBy,
    UniversityAccountStatus,
} from "../domain/UniversityModel";

const allowedAccountStatuses = [
    UniversityAccountStatus.CREATED,
    UniversityAccountStatus.APPROVED,
    UniversityAccountStatus.REJECTED,
];
const UniversitySchema = new mongoose.Schema(
    {
        code: { type: String, unique: true, indexx: true },
        name: { type: String },
        address: { type: String },
        domain: { type: String, unique: true },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        staffs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        registeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        noStudentsWithDisability: { type: String },
        escalationHandledBy: {
            type: String,
            enum: [
                EscalationsHandledBy.UNIVERSITY,
                EscalationsHandledBy.I_STEM,
                EscalationsHandledBy.NONE,
            ],
        },
        domainAccess: {
            type: String,
            enum: [DomainAccess.AUTO, DomainAccess.MANUAL, DomainAccess.NONE],
        },
        accountStatus: { type: String, enum: allowedAccountStatuses },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: allowedAccountStatuses,
                    index: true,
                },
                actionAt: Date,
            },
        ],
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

export default mongoose.model<University & mongoose.Document>(
    "University",
    UniversitySchema
);
