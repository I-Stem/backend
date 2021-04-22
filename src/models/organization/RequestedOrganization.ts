import mongoose from "mongoose";
import { HandleAccessibilityRequests,
    OrganizationRequestedType,
    OrganizationRequestStatus,
 } from "../../domain/organization/OrganizationConstants";
import {RequestedOrganizationModel,
    RequestedOrganizationProps,
} from "../../domain/organization/RequestedOrganization";

const RequestStatusArray = [
    OrganizationRequestStatus.REQUESTED,
    OrganizationRequestStatus.APPROVED,
    OrganizationRequestStatus.REJECTED,
];

const RequestedOrganizationTypeArray = [
    OrganizationRequestedType.BUSINESS,
    OrganizationRequestedType.UNIVERSITY,
];

const RequestedOrganizationSchema = new mongoose.Schema(
    {
        registeredByUserName: { type: String },
        organizationName: { type: String },
        registeredByUserEmail: { type: String, unique: true },
        status: {
            type: String,
            enum: RequestStatusArray,
        },
        statusLog: [
            {
                status: {
                    type: String,
                    enum: RequestStatusArray,
                },
                actionAt: { type: Date },
            },
        ],
        organizationType: {
            type: String,
            enum: RequestedOrganizationTypeArray,
        },
        organizationCode: { type: String },
        handleAccessibilityRequests: {
            type: String,
            enum: [
                HandleAccessibilityRequests.AUTO,
                HandleAccessibilityRequests.MANUAL,
                HandleAccessibilityRequests.ASK_USER,
            ],
        },
        showRemediationSetting: { type: Boolean },
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);

export default mongoose.model<
    RequestedOrganizationModel & mongoose.Document
>("RequestedOrganization", RequestedOrganizationSchema);


