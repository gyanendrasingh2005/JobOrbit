import mongoose from "mongoose";

export const HIRING_STAGES = [
    "Applied",
    "Under Review",
    "Accepted",
    "Shortlisted — Round 1",
    "Round 1 Completed",
    "Shortlisted — Round 2",
    "Round 2 Completed",
    "Shortlisted — Round 3",
    "Round 3 Completed",
    "Selected",
    "Rejected",
    "Withdrawn",
];

export const APPLICATION_STATUSES = [
    ...HIRING_STAGES,
    // Variations & aliases for robust matching
    "Shortlisted for Round 1",
    "Shortlisted for Round 2",
    "Shortlisted for Round 3",
    "Shortlisted",
    "Interview Scheduled",
    "Moved to Next Round",
    "Shortlisted — Technical Round",
    "Shortlisted — HR Round",
    // Legacy lowercase values present in existing MongoDB database records
    "pending",
    "accepted",
    "rejected",
];

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
    },
    previousStatus: {
        type: String,
        default: "",
    },
    eventType: {
        type: String,
        default: "status_change",
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    notes: {
        type: String,
        default: "",
    },
    feedback: {
        type: String,
        default: "",
    },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "Applied",
        trim: true,
    },
    currentRound: {
        type: String,
        default: "",
    },
    statusHistory: [statusHistorySchema],
    internalNotes: {
        type: String,
        default: "",
    },
    feedback: {
        type: String,
        default: "",
    },
    interviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
        }
    ],
    confirmationEmailSent: {
        type: Boolean,
        default: false,
    },
    lastEmailSentAt: {
        type: Date,
    },
    lastEmailError: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Compound unique index to prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
