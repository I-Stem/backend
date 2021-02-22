import mongoose from "mongoose";
import {
    University,
    DomainAccess,
    EscalationsHandledBy,
    UniversityAccountStatus,
    DomainAccessStatus,
} from "../domain/organization/OrganizationModel";

const allowedAccountStatuses = [
    UniversityAccountStatus.CREATED,
    UniversityAccountStatus.APPROVED,
    UniversityAccountStatus.REJECTED,
];

const allowedDomainAccessStatus = [
    DomainAccessStatus.NOT_VERIFIED,
    DomainAccessStatus.PENDING,
    DomainAccessStatus.VERIFIED,
];

const UniversitySchema = new mongoose.Schema(
    {
        code: { type: String, unique: true, index: true },
        name: { type: String },
        address: { type: String },
        domain: { type: String, unique: true },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        staffs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        registeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        organizationType: { type: String },
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
        domainAccessStatusLog: [
            {
                status: {
                    type: String,
                    enum: allowedDomainAccessStatus,
                    index: true,
                    default: DomainAccessStatus.NOT_VERIFIED,
                },
                actionAt: Date,
            },
        ],
        domainAccessRequestedBy: {
            type: mongoose.Schema.Types.ObjectId,
        },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

UniversitySchema.virtual("domainAccessStatus").get(function () {
    return this
        .domainAccessStatusLog[this.domainAccessStatusLog.length - 1].status;
});

export default mongoose.model<University & mongoose.Document>(
    "University",
    UniversitySchema
);
