import { boolean } from "@hapi/joi";
import mongoose from "mongoose";
import { type } from "os";
import HackathonModel from "../domain/HackathonModel";

const HackathonSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isPWD: { type: Boolean },
        associatedDisabilities: [{ type: String }],
        designation: { type: String },
        orgName: { type: String },
        canCode: { type: Boolean },
        anythingElse: { type: String },
        expectations: { type: String },
        preferedAreas: { type: String },
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
    }
);
export default mongoose.model<HackathonModel & mongoose.Document>(
    "Hackathon",
    HackathonSchema
);
