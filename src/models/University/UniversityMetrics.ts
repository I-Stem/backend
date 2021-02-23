import mongoose from "mongoose";
import UniversityMetricsModel from "../../domain/University/UniversityMetrics";

const UniversityMetricsSchema = new mongoose.Schema({
    afc: {
        averageRating: { type: String },
        averageResolution: { type: String },
        studentsUsingService: { type: String },
        requestsByStudents: { type: String },
    },
    vc: {
        averageRating: { type: String },
        averageResolution: { type: String },
        studentsUsingService: { type: String },
        requestsByStudents: { type: String },
    },
    universityCode: { type: String },
});

const UniversityMetrics = mongoose.model<
    UniversityMetricsModel & mongoose.Document
>("UniversityMetrics", UniversityMetricsSchema);

export default UniversityMetrics;
