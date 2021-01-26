import mongoose from "mongoose";
import { UniversityRoles } from "../domain/UniversityModel";
import { InvitedUser, InvitedUserEnum } from "../domain/InvitedUserModel";

const InvitedUserSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true, lowercase: true, required: true },
        university: { type: String },
        fullName: { type: String },
        verifyToken: { type: String },
        isRegistered: { type: Boolean, default: false },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: [
                        InvitedUserEnum.INVITATION_SENT,
                        InvitedUserEnum.REGISTERED,
                    ],
                },
                actionAt: Date,
            },
        ],
        status: {
            type: String,
            enum: [InvitedUserEnum.INVITATION_SENT, InvitedUserEnum.REGISTERED],
        },
        rollNumber: { type: String },
        role: {
            type: String,
            enum: [
                UniversityRoles.STUDENT,
                UniversityRoles.STAFF,
                UniversityRoles.REMEDIATOR,
            ],
        },
        userType: {
            type: String,
            enum: [UserType.BUSINESS, UserType.UNIVERSITY, UserType.I_STEM],
        },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

/**
 *  Populate InvitedUser with verify Token
 */
InvitedUserSchema.pre("insertMany", function (next, docs) {
    docs.map((user: InvitedUser) => {
        const verifyToken = Buffer.from(
            (user.email + (Math.random() * 1000).toString).trim()
        ).toString("base64");
        user.verifyToken = verifyToken;
    });
    next();
});

export default mongoose.model<InvitedUser & mongoose.Document>(
    "InvitedUser",
    InvitedUserSchema
);
