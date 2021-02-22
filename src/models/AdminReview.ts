/**
 * Define model for Admin Review
 *
 */

import {AdminReviewModel} from "../domain/AdminReviewModel";
 import {
    AdminReviewStatus,
    ReviewEnum,
    ReviewRequestType,
} from "../domain/AdminReviewModel/AdminReviewConstants";
import mongoose from "mongoose";
import { ServiceRoleEnum } from "./User";

export const AdminReviewSchema = new mongoose.Schema(
    {
        serviceRoleRequest: {
            url: { type: String },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            role: {
                type: String,
                enum: [ServiceRoleEnum.PREMIUM, ServiceRoleEnum.REGULAR],
            },
            fullName: { type: String },
            email: { type: String },
        },
        organizationRequest: {
            organizationCode: { type: String },
            organizationName: { type: String },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        domainAccessRequest: {
            organizationCode: { type: String },
            domain: { type: String },
            requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            organizationName: { type: String },
        },
        status: { type: String },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: [ReviewEnum.REQUESTED, ReviewEnum.REVIEWED],
                },
                actionAt: { type: Date },
            },
        ],
        requestType: {
            type: String,
            enum: [
                ReviewRequestType.AUTO_DOMAIN,
                ReviewRequestType.ORGANIZATION,
                ReviewRequestType.SERVICE,
            ],
        },
        adminReviewStatus: {
            type: String,
            enum: [AdminReviewStatus.APPROVED, AdminReviewStatus.REJECTED],
        },
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

const AdminReview = mongoose.model<AdminReviewModel & mongoose.Document>(
    "AdminReview",
    AdminReviewSchema
);

export default AdminReview;
