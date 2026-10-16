import mongoose from "mongoose";

export const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];
export const INTERVIEW_TYPES = ["online", "in-person"];

const reminderSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["24h", "1h"],
        required: true,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const interviewSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    interviewDate: {
        type: Date,
        required: true,
    },
    timeZone: {
        type: String,
        default: "UTC",
    },
    roundNumber: {
        type: Number,
        default: 1,
        min: 1,
    },
    duration: {
        type: Number, // in minutes
        required: true,
        default: 45,
    },
    interviewType: {
        type: String,
        enum: INTERVIEW_TYPES,
        default: "online",
    },
    meetingUrl: {
        type: String,
        default: "",
    },
    location: {
        type: String,
        default: "",
    },
    instructions: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: INTERVIEW_STATUSES,
        default: "Scheduled",
    },
    remindersSent: [reminderSchema],
}, { timestamps: true });

// Indexes for query performance and scheduled reminder lookup
interviewSchema.index({ candidate: 1, interviewDate: 1 });
interviewSchema.index({ recruiter: 1, interviewDate: 1 });
interviewSchema.index({ status: 1, interviewDate: 1 });
interviewSchema.index({ application: 1 });

export const Interview = mongoose.model("Interview", interviewSchema);
