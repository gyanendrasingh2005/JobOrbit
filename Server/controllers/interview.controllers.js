import { Interview, INTERVIEW_STATUSES, INTERVIEW_TYPES } from "../models/interview.models.js";
import { Application } from "../models/application.models.js";
import { Job } from "../models/job.models.js";
import { User } from "../models/user.model.js";
import {
    sendInterviewInvitationEmail,
    sendInterviewRescheduledEmail,
    sendInterviewCancelledEmail,
} from "../utils/emailService.js";
import mongoose from "mongoose";

/**
 * Validates whether a given URL is a valid web link
 */
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
};

// =========================================================================
// 1. Recruiter: Schedule Interview
// =========================================================================
export const scheduleInterview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const {
            applicationId,
            interviewDate,
            timeZone = "UTC",
            duration = 45,
            roundNumber = 1,
            interviewType = "online",
            meetingUrl = "",
            location = "",
            instructions = "",
            customSubject,
            customMessage,
        } = req.body;

        // Validation
        if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Valid Application ID is required",
                success: false,
            });
        }

        if (!interviewDate) {
            return res.status(400).json({
                message: "Interview date and time is required",
                success: false,
            });
        }

        const parsedDate = new Date(interviewDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid interview date format",
                success: false,
            });
        }

        // Prevent scheduling in the past (allow 2-minute margin for network lag)
        if (parsedDate.getTime() <= Date.now() - 2 * 60 * 1000) {
            return res.status(400).json({
                message: "Interview date and time cannot be in the past",
                success: false,
            });
        }

        const durationNum = Number(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
            return res.status(400).json({
                message: "Duration must be a positive number of minutes",
                success: false,
            });
        }

        const roundNum = Math.max(1, Number(roundNumber) || 1);

        if (!INTERVIEW_TYPES.includes(interviewType)) {
            return res.status(400).json({
                message: `Invalid interview type. Must be one of: ${INTERVIEW_TYPES.join(", ")}`,
                success: false,
            });
        }

        if (interviewType === "online" && meetingUrl && !isValidUrl(meetingUrl)) {
            return res.status(400).json({
                message: "Please provide a valid meeting URL (must begin with http:// or https://)",
                success: false,
            });
        }

        if (interviewType === "in-person" && !location.trim()) {
            return res.status(400).json({
                message: "Location/address is required for in-person interviews",
                success: false,
            });
        }

        // Fetch application and verify recruiter authorization
        const application = await Application.findById(applicationId)
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("applicant");

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Ensure recruiter owns this job or the company
        const isJobCreator = application.job?.created_by?.toString() === recruiterId;
        const isCompanyOwner = application.job?.company?.userId?.toString() === recruiterId;

        if (!isJobCreator && !isCompanyOwner) {
            return res.status(403).json({
                message: "Unauthorized: You do not own the job posting or company for this applicant",
                success: false,
            });
        }

        // Create the interview
        const newInterview = await Interview.create({
            job: application.job._id,
            application: application._id,
            candidate: application.applicant._id,
            recruiter: recruiterId,
            interviewDate: parsedDate,
            timeZone,
            roundNumber: roundNum,
            duration: durationNum,
            interviewType,
            meetingUrl: meetingUrl.trim(),
            location: location.trim(),
            instructions: instructions.trim(),
            status: "Scheduled",
            remindersSent: [],
        });

        // Link interview to application and update application status
        application.interviews.push(newInterview._id);
        const stageStatus = `Shortlisted — Round ${roundNum}`;
        application.status = stageStatus;
        application.currentRound = `Round ${roundNum}`;
        application.statusHistory.push({
            status: stageStatus,
            changedAt: new Date(),
            changedBy: recruiterId,
            notes: `Round ${roundNum} interview scheduled for ${parsedDate.toUTCString()}`,
        });
        await application.save();

        // Send interview invitation email
        let emailResult = { success: false, skipped: true };
        try {
            emailResult = await sendInterviewInvitationEmail({
                candidateEmail: application.applicant.email,
                candidateName: application.applicant.fullname,
                jobTitle: application.job.title,
                companyName: application.job?.company?.companyName || "the hiring team",
                interviewDate: parsedDate,
                timeZone,
                roundNumber: roundNum,
                duration: durationNum,
                interviewType,
                meetingUrl: meetingUrl.trim(),
                location: location.trim(),
                instructions: instructions.trim(),
                customSubject,
                customMessage,
            });

            if (emailResult.success) {
                await Application.findByIdAndUpdate(application._id, {
                    lastEmailSentAt: new Date(),
                    lastEmailError: null,
                });
            } else if (!emailResult.skipped) {
                await Application.findByIdAndUpdate(application._id, {
                    lastEmailError: emailResult.error || "Interview email failed to deliver",
                });
            }
        } catch (err) {
            console.error("[ScheduleInterview] Email error:", err.message);
            emailResult = { success: false, error: err.message };
            await Application.findByIdAndUpdate(application._id, {
                lastEmailError: err.message,
            });
        }

        const populatedInterview = await Interview.findById(newInterview._id)
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate({
                path: "job",
                populate: { path: "company" },
            });

        return res.status(201).json({
            message: emailResult.success
                ? "Interview successfully scheduled! Invitation dispatched to candidate."
                : `Interview successfully scheduled! Note: Notification email could not be delivered (${emailResult.error || "mail provider error"}).`,
            interview: populatedInterview,
            emailSent: Boolean(emailResult.success),
            emailError: emailResult.success ? null : (emailResult.error || null),
            success: true,
        });
    } catch (error) {
        console.error("ScheduleInterview Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to schedule interview",
            success: false,
        });
    }
};

// =========================================================================
// 2. Recruiter: Reschedule Interview
// =========================================================================
export const rescheduleInterview = async (req, res) => {
    try {
        const interviewId = req.params.id;
        const recruiterId = req.id;
        const {
            newDate,
            timeZone,
            duration,
            meetingUrl,
            location,
            instructions,
        } = req.body;

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({
                message: "Valid Interview ID is required",
                success: false,
            });
        }

        if (!newDate) {
            return res.status(400).json({
                message: "New interview date and time is required",
                success: false,
            });
        }

        const parsedDate = new Date(newDate);
        if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
            return res.status(400).json({
                message: "New interview date must be a valid future date",
                success: false,
            });
        }

        const interview = await Interview.findById(interviewId)
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("candidate")
            .populate("application");

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        // Authorize recruiter
        if (interview.recruiter.toString() !== recruiterId) {
            return res.status(403).json({
                message: "Unauthorized to reschedule this interview",
                success: false,
            });
        }

        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Cannot reschedule an interview that has already been cancelled. Please schedule a new interview.",
                success: false,
            });
        }

        interview.interviewDate = parsedDate;
        if (timeZone) interview.timeZone = timeZone;
        if (duration) interview.duration = Number(duration);
        if (meetingUrl !== undefined) interview.meetingUrl = meetingUrl.trim();
        if (location !== undefined) interview.location = location.trim();
        if (instructions !== undefined) interview.instructions = instructions.trim();
        interview.status = "Rescheduled";
        // Reset reminder array so candidate gets 24h and 1h reminders for the newly scheduled time
        interview.remindersSent = [];

        await interview.save();

        // Update application history
        if (interview.application) {
            await Application.findByIdAndUpdate(interview.application._id, {
                $push: {
                    statusHistory: {
                        status: "Interview Scheduled",
                        changedAt: new Date(),
                        changedBy: recruiterId,
                        notes: `Interview rescheduled to ${parsedDate.toUTCString()}`,
                    },
                },
            });
        }

        // Send rescheduling email
        sendInterviewRescheduledEmail({
            candidateEmail: interview.candidate.email,
            candidateName: interview.candidate.fullname,
            jobTitle: interview.job.title,
            companyName: interview.job?.company?.companyName || "the hiring team",
            newDate: parsedDate,
            timeZone: interview.timeZone,
            duration: interview.duration,
            meetingUrl: interview.meetingUrl,
            location: interview.location,
            instructions: interview.instructions,
        }).catch((err) => {
            console.error("[RescheduleInterview] Background email error:", err.message);
        });

        return res.status(200).json({
            message: "Interview rescheduled successfully and candidate notified.",
            interview,
            success: true,
        });
    } catch (error) {
        console.error("RescheduleInterview Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to reschedule interview",
            success: false,
        });
    }
};

// =========================================================================
// 3. Recruiter: Cancel Interview
// =========================================================================
export const cancelInterview = async (req, res) => {
    try {
        const interviewId = req.params.id;
        const recruiterId = req.id;
        const { reason = "" } = req.body;

        if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({
                message: "Valid Interview ID is required",
                success: false,
            });
        }

        const interview = await Interview.findById(interviewId)
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("candidate")
            .populate("application");

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found",
                success: false,
            });
        }

        if (interview.recruiter.toString() !== recruiterId) {
            return res.status(403).json({
                message: "Unauthorized: Only the organizing recruiter can cancel this interview",
                success: false,
            });
        }

        if (interview.status === "Cancelled") {
            return res.status(400).json({
                message: "Interview is already cancelled",
                success: false,
            });
        }

        interview.status = "Cancelled";
        await interview.save();

        // Update application history
        if (interview.application) {
            await Application.findByIdAndUpdate(interview.application._id, {
                $push: {
                    statusHistory: {
                        status: "Under Review",
                        changedAt: new Date(),
                        changedBy: recruiterId,
                        notes: `Interview cancelled: ${reason || "No reason provided"}`,
                    },
                },
            });
        }

        // Send cancellation notice
        sendInterviewCancelledEmail({
            candidateEmail: interview.candidate.email,
            candidateName: interview.candidate.fullname,
            jobTitle: interview.job.title,
            companyName: interview.job?.company?.companyName || "the hiring team",
            reason,
        }).catch((err) => {
            console.error("[CancelInterview] Background email error:", err.message);
        });

        return res.status(200).json({
            message: "Interview cancelled and candidate notified.",
            interview,
            success: true,
        });
    } catch (error) {
        console.error("CancelInterview Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to cancel interview",
            success: false,
        });
    }
};

// =========================================================================
// 4. Job Seeker & Recruiter: Get My Interviews (Upcoming / Past)
// =========================================================================
export const getMyInterviews = async (req, res) => {
    try {
        const userId = req.id;
        const { filter = "upcoming" } = req.query; // 'upcoming' | 'all' | 'past'

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false,
            });
        }

        const isRecruiter = user.role === "recruiter";
        const query = isRecruiter ? { recruiter: userId } : { candidate: userId };

        const now = new Date();
        if (filter === "upcoming") {
            query.interviewDate = { $gte: now };
            query.status = { $in: ["Scheduled", "Rescheduled"] };
        } else if (filter === "past") {
            query.$or = [
                { interviewDate: { $lt: now } },
                { status: { $in: ["Completed", "Cancelled"] } },
            ];
        }

        const sortOrder = filter === "upcoming" ? 1 : -1;

        const interviews = await Interview.find(query)
            .sort({ interviewDate: sortOrder })
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("application", "status statusHistory");

        return res.status(200).json({
            interviews: interviews || [],
            success: true,
        });
    } catch (error) {
        console.error("GetMyInterviews Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve interviews",
            success: false,
        });
    }
};

// =========================================================================
// 5. Get Interviews by Application ID
// =========================================================================
export const getInterviewsByApplication = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const userId = req.id;

        const application = await Application.findById(applicationId).populate("job");
        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Must be candidate or job recruiter
        const isCandidate = application.applicant.toString() === userId;
        const isRecruiter = application.job?.created_by?.toString() === userId;

        if (!isCandidate && !isRecruiter) {
            return res.status(403).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const interviews = await Interview.find({ application: applicationId })
            .sort({ interviewDate: -1 })
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email");

        return res.status(200).json({
            interviews: interviews || [],
            success: true,
        });
    } catch (error) {
        console.error("GetInterviewsByApplication Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve interviews",
            success: false,
        });
    }
};
