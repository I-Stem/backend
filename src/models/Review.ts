import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
    {
        ratings: Number,
        text: String,
        createdAt: { type: Date, default: Date.now }
    },
    {
        // id: true,
        // timestamps: true,
        strict: false,
        toJSON: {
            virtuals: true,
            getters: true
        },
        toObject: {
            virtuals: true,
            getters: true
        }
    }
);

export default ReviewSchema;
