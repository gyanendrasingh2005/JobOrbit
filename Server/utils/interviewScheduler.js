import mongoose from "mongoose";
import connectDB from "./db.js";
import { Interview } from "../models/interview.models.js";
import { sendInterviewReminderEmail } from "./emailService.js";

let schedulerInterval = null;

export const checkAndSendReminders = async () => {
    try {
        // Ensure MongoDB is connected before running queries to prevent buffering timeout
        if (mongoose.connection.readyState !== 1) {
            try {
                await connectDB();
            } catch (connErr) {
                console.warn("[InterviewScheduler] Database connection not ready, skipping tick:", connErr.message);
                return;
            }
        }

        if (mongoose.connection.readyState !== 1) {
            return;
        }

        const now = new Date();
        // Look ahead up to 25 hours for any scheduled interviews
        const maxFuture = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const upcomingInterviews = await Interview.find({
            status: "Scheduled",
            interviewDate: { $gt: now, $lte: maxFuture },
        })
            .populate("candidate")
            .populate("recruiter")
            .populate({
                path: "job",
                populate: { path: "company" },
            });

        for (const interview of upcomingInterviews) {
            // Re-verify candidate email and job details exist
            if (!interview?.candidate?.email || !interview?.job) {
                continue;
            }

            const msUntil = new Date(interview.interviewDate).getTime() - now.getTime();
            const minutesUntil = msUntil / (1000 * 60);

            const has24h = interview.remindersSent?.some((r) => r.type === "24h");
            const has1h = interview.remindersSent?.some((r) => r.type === "1h");

            // 1-Hour Reminder Window: between 5 and 65 minutes before interview
            if (minutesUntil <= 65 && minutesUntil >= 5 && !has1h) {
                // Re-verify status atomically to prevent race conditions
                const freshInterview = await Interview.findOne({ _id: interview._id, status: "Scheduled" });
                if (freshInterview && !freshInterview.remindersSent?.some((r) => r.type === "1h")) {
                    await sendInterviewReminderEmail({
                        candidateEmail: interview.candidate.email,
                        candidateName: interview.candidate.fullname,
                        jobTitle: interview.job.title,
                        companyName: interview.job?.company?.companyName || "the company",
                        interviewDate: interview.interviewDate,
                        timeZone: interview.timeZone,
                        duration: interview.duration,
                        reminderType: "1h",
                        meetingUrl: interview.meetingUrl,
                        location: interview.location,
                    });

                    await Interview.findByIdAndUpdate(interview._id, {
                        $push: { remindersSent: { type: "1h", sentAt: new Date() } },
                    });
                }
            }
            // 24-Hour Reminder Window: between 65 minutes and 24.5 hours before interview
            else if (minutesUntil <= 24.5 * 60 && minutesUntil > 65 && !has24h) {
                const freshInterview = await Interview.findOne({ _id: interview._id, status: "Scheduled" });
                if (freshInterview && !freshInterview.remindersSent?.some((r) => r.type === "24h")) {
                    await sendInterviewReminderEmail({
                        candidateEmail: interview.candidate.email,
                        candidateName: interview.candidate.fullname,
                        jobTitle: interview.job.title,
                        companyName: interview.job?.company?.companyName || "the company",
                        interviewDate: interview.interviewDate,
                        timeZone: interview.timeZone,
                        duration: interview.duration,
                        reminderType: "24h",
                        meetingUrl: interview.meetingUrl,
                        location: interview.location,
                    });

                    await Interview.findByIdAndUpdate(interview._id, {
                        $push: { remindersSent: { type: "24h", sentAt: new Date() } },
                    });
                }
            }
        }
    } catch (error) {
        console.error("[InterviewScheduler] Error checking upcoming interview reminders:", error.message);
    }
};

export const startInterviewScheduler = (intervalMs = 60000) => {
    if (schedulerInterval) return;
    console.log("[InterviewScheduler] Interview reminder scheduler started (runs every 60s)");
    // Run an initial check after 5 seconds to catch anything pending
    setTimeout(() => {
        checkAndSendReminders().catch((err) => console.error(err.message));
    }, 5000);

    schedulerInterval = setInterval(() => {
        checkAndSendReminders().catch((err) => console.error(err.message));
    }, intervalMs);
};

export const stopInterviewScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log("[InterviewScheduler] Scheduler stopped");
    }
};
