import { Application, APPLICATION_STATUSES, HIRING_STAGES } from "../models/application.models.js";
import { Job } from "../models/job.models.js";
import { User } from "../models/user.model.js";
import { Interview } from "../models/interview.models.js";
import { Company } from "../models/company.models.js";
import {
    sendApplicationConfirmationEmail,
    sendStatusUpdateEmail,
} from "../utils/emailService.js";
import mongoose from "mongoose";

/**
 * Normalizes status string to canonical HIRING_STAGES format
 */
export const normalizeStatus = (status) => {
    if (!status) return "Applied";
    const raw = status.trim();

    // 1. Check exact match against canonical HIRING_STAGES (case-insensitive)
    const exactHiring = HIRING_STAGES.find((s) => s.toLowerCase() === raw.toLowerCase());
    if (exactHiring) return exactHiring;

    // 2. Check exact match against APPLICATION_STATUSES
    const exact = APPLICATION_STATUSES.find((s) => s.toLowerCase() === raw.toLowerCase());
    if (exact) {
        if (exact === "pending") return "Applied";
        if (exact.toLowerCase() === "accepted") return "Accepted";
        if (exact.toLowerCase() === "rejected") return "Rejected";
        if (exact === "Shortlisted" || exact.startsWith("Shortlisted for Round 1")) return "Shortlisted — Round 1";
        if (exact.startsWith("Shortlisted for Round 2")) return "Shortlisted — Round 2";
        if (exact.startsWith("Shortlisted for Round 3")) return "Shortlisted — Round 3";
        if (exact === "Moved to Next Round") return "Shortlisted — Round 2";
        return exact;
    }

    // 3. Normalize dashes and spacing
    const s = raw.toLowerCase().replace(/[-—_]/g, " ").replace(/\s+/g, " ").trim();
    if (s === "pending" || s === "applied") return "Applied";
    if (s.includes("under review") || s === "review") return "Under Review";
    if (s.includes("accepted") || s.includes("accept")) return "Accepted";

    // Dynamic round matching: e.g. "round 4 completed", "shortlisted round 5", "round 2"
    const roundMatch = raw.match(/round\s*(\d+)/i);
    if (roundMatch) {
        const roundNum = roundMatch[1];
        if (s.includes("completed")) return `Round ${roundNum} Completed`;
        return `Shortlisted — Round ${roundNum}`;
    }

    if (s.includes("technical")) return "Shortlisted — Technical Round";
    if (s.includes("hr")) return "Shortlisted — HR Round";
    if (s.includes("next round")) return "Shortlisted — Round 2";
    if (s.includes("shortlist")) return "Shortlisted — Round 1";
    if (s.includes("interview")) return "Interview Scheduled";
    if (s.includes("select") || s.includes("offer") || s.includes("hired")) return "Selected";
    if (s.includes("reject")) return "Rejected";
    if (s.includes("withdraw")) return "Withdrawn";

    if (raw && raw.length > 0 && raw.length <= 80) {
        return raw;
    }
    return null;
};

// =========================================================================
// 1. Job Seeker: Apply for a Job
// =========================================================================
export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Valid Job ID is required",
                success: false,
            });
        }

        // 1. Validate user and resume
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                message: "User account not found. Please log in again.",
                success: false,
            });
        }

        // Check if user has a resume uploaded
        if (!user.profile?.resume) {
            return res.status(400).json({
                message: "Please upload your resume in your profile before applying for jobs.",
                missingResume: true,
                success: false,
            });
        }

        // 2. Check if job exists
        const job = await Job.findById(jobId).populate("company");
        if (!job) {
            return res.status(404).json({
                message: "Job opening does not exist or has been removed",
                success: false,
            });
        }

        // 3. Prevent duplicate applications
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: userId,
        });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                alreadyApplied: true,
                success: false,
            });
        }

        // 4. Create new application with status 'Applied'
        const initialStatus = "Applied";
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId,
            status: initialStatus,
            statusHistory: [
                {
                    status: initialStatus,
                    changedAt: new Date(),
                    changedBy: userId,
                    notes: "Application submitted by candidate",
                },
            ],
            confirmationEmailSent: false,
        });

        // 5. Link application to job
        job.applications.push(newApplication._id);
        await job.save();

        // 6. Asynchronously send confirmation email (failures logged safely without rolling back DB)
        sendApplicationConfirmationEmail({
            candidateEmail: user.email,
            candidateName: user.fullname,
            jobTitle: job.title,
            companyName: job.company?.companyName || "the hiring team",
            applicationId: newApplication._id,
        })
            .then(async (emailResult) => {
                if (emailResult.success) {
                    await Application.findByIdAndUpdate(newApplication._id, {
                        confirmationEmailSent: true,
                        lastEmailSentAt: new Date(),
                        lastEmailError: null,
                    });
                } else if (!emailResult.skipped) {
                    await Application.findByIdAndUpdate(newApplication._id, {
                        lastEmailError: emailResult.error || "Email delivery failed",
                    });
                }
            })
            .catch(async (err) => {
                console.error("[ApplyJob] Background email error:", err.message);
                await Application.findByIdAndUpdate(newApplication._id, {
                    lastEmailError: err.message,
                });
            });

        return res.status(201).json({
            message: "Application submitted successfully! A confirmation email has been dispatched.",
            application: newApplication,
            success: true,
        });
    } catch (error) {
        console.error("ApplyJob Error:", error.message);
        // Handle MongoDB duplicate key error gracefully
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You have already submitted an application for this position.",
                success: false,
            });
        }
        return res.status(500).json({
            message: error.message || "Failed to process application",
            success: false,
        });
    }
};

// =========================================================================
// 2. Job Seeker: Get all applied jobs with full history & interviews
// =========================================================================
export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;

        const applications = await Application.find({ applicant: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: "job",
                populate: [
                    { path: "company" },
                    { path: "created_by", select: "fullname email phoneNumber" },
                ],
            })
            .populate({
                path: "interviews",
                options: { sort: { interviewDate: 1 } },
            })
            .populate({
                path: "statusHistory.changedBy",
                select: "fullname role",
            });

        const normalizedApplications = (applications || []).map((app) => {
            const appObj = app.toObject ? app.toObject() : app;
            appObj.status = normalizeStatus(appObj.status) || appObj.status;
            const lastHistory = appObj.statusHistory && appObj.statusHistory.length > 0
                ? appObj.statusHistory[appObj.statusHistory.length - 1]
                : null;
            appObj.latestStatusUpdateAt = lastHistory?.changedAt || appObj.updatedAt || appObj.createdAt;
            return appObj;
        });

        return res.status(200).json({
            application: normalizedApplications,
            success: true,
        });
    } catch (error) {
        console.error("GetAppliedJobs Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve applied jobs",
            success: false,
        });
    }
};

// =========================================================================
// 3. Recruiter: Get all applicants for a specific Job
// =========================================================================
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.id;

        if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Valid Job ID is required",
                success: false,
            });
        }

        const job = await Job.findById(jobId).populate("company");
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false,
            });
        }

        // Verify authorization: creator of the job OR owner of the company
        const jobCreatorId = job.created_by?._id?.toString() || job.created_by?.toString();
        const companyOwnerId = job.company?.userId?._id?.toString() || job.company?.userId?.toString();
        const currentUserId = userId?.toString();

        const isJobCreator = jobCreatorId === currentUserId;
        const isCompanyOwner = companyOwnerId === currentUserId;

        if (!isJobCreator && !isCompanyOwner) {
            return res.status(403).json({
                message: "You are not authorized to view applicants for this job opening.",
                success: false,
            });
        }

        // Directly query the primary Application collection to ensure 100% accuracy
        const applications = await Application.find({ job: jobId })
            .sort({ createdAt: -1 })
            .populate({
                path: "applicant",
                select: "fullname email phoneNumber profile",
            })
            .populate({
                path: "interviews",
                options: { sort: { interviewDate: -1 } },
            })
            .populate({
                path: "statusHistory.changedBy",
                select: "fullname role",
            });

        // Synchronize job.applications array if needed
        const appIds = applications.map((a) => a._id);
        if (job.applications.length !== appIds.length) {
            job.applications = appIds;
            await job.save();
        }

        const normalizedApplications = applications.map((app) => {
            const appObj = app.toObject ? app.toObject() : app;
            appObj.status = normalizeStatus(appObj.status) || appObj.status;
            return appObj;
        });

        const jobObj = job.toObject();
        jobObj.applications = normalizedApplications;
        jobObj.applicantCount = normalizedApplications.length;

        return res.status(200).json({
            job: jobObj,
            success: true,
        });
    } catch (error) {
        console.error("GetApplicants Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve applicants",
            success: false,
        });
    }
};

// =========================================================================
// 3.1 Recruiter: Get All Applicants Across All Owned Jobs & Companies
// =========================================================================
export const getAllRecruiterApplicants = async (req, res) => {
    try {
        const recruiterId = req.id;
        const {
            companyId,
            jobId,
            status,
            search = "",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // 1. Identify all companies owned by this recruiter
        const userCompanies = await Company.find({ userId: recruiterId }).select("_id");
        const companyIds = userCompanies.map((c) => c._id);

        // 2. Identify all jobs owned by recruiter or under their companies
        const jobFilter = {
            $or: [
                { created_by: recruiterId },
                { company: { $in: companyIds } },
            ],
        };

        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            jobFilter.company = companyId;
        }
        if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
            jobFilter._id = jobId;
        }

        const recruiterJobs = await Job.find(jobFilter).select("_id title company");
        const recruiterJobIds = recruiterJobs.map((j) => j._id);

        if (recruiterJobIds.length === 0) {
            return res.status(200).json({
                applications: [],
                total: 0,
                page: Number(page) || 1,
                totalPages: 0,
                success: true,
            });
        }

        // 3. Build Application filter
        const appQuery = { job: { $in: recruiterJobIds } };

        if (status && status !== "All") {
            const normalizedFilterStatus = normalizeStatus(status);
            if (normalizedFilterStatus === "Applied") {
                appQuery.status = { $in: ["Applied", "pending"] };
            } else if (normalizedFilterStatus === "Rejected") {
                appQuery.status = { $in: ["Rejected", "rejected"] };
            } else if (normalizedFilterStatus === "Accepted") {
                appQuery.status = { $in: ["Accepted", "accepted"] };
            } else if (normalizedFilterStatus) {
                appQuery.status = normalizedFilterStatus;
            } else {
                appQuery.status = status;
            }
        }

        // Search candidate name or email or job title
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");
            const matchingUsers = await User.find({
                $or: [
                    { fullname: searchRegex },
                    { email: searchRegex },
                ],
            }).select("_id");
            const matchingUserIds = matchingUsers.map((u) => u._id);

            const matchingJobs = await Job.find({
                _id: { $in: recruiterJobIds },
                title: searchRegex,
            }).select("_id");
            const matchingJobIds = matchingJobs.map((j) => j._id);

            appQuery.$or = [
                { applicant: { $in: matchingUserIds } },
                { job: { $in: matchingJobIds } },
            ];
        }

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const sortDirection = sortOrder === "asc" ? 1 : -1;
        const sortCriteria = {};
        sortCriteria[sortBy || "createdAt"] = sortDirection;

        const [total, applications] = await Promise.all([
            Application.countDocuments(appQuery),
            Application.find(appQuery)
                .sort(sortCriteria)
                .skip(skip)
                .limit(limitNum)
                .populate({
                    path: "job",
                    populate: { path: "company" },
                })
                .populate("applicant", "fullname email phoneNumber profile")
                .populate("interviews")
                .populate("statusHistory.changedBy", "fullname role"),
        ]);

        const normalizedApplications = (applications || []).map((app) => {
            const appObj = app.toObject ? app.toObject() : app;
            appObj.status = normalizeStatus(appObj.status) || appObj.status;
            return appObj;
        });

        return res.status(200).json({
            applications: normalizedApplications,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            success: true,
        });
    } catch (error) {
        console.error("GetAllRecruiterApplicants Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve recruiter applicants",
            success: false,
        });
    }
};

// =========================================================================
// 4. Recruiter: Update Application Status with History & Notification
// =========================================================================
export const updateStatus = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const recruiterId = req.id;
        const {
            status,
            notes,
            feedback,
            customSubject,
            customMessage,
            roundName,
            sendEmail = true,
        } = req.body;

        if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: "Valid Application ID is required",
                success: false,
            });
        }

        if (!status && !roundName) {
            return res.status(400).json({
                message: "Target status or round name is required",
                success: false,
            });
        }

        let targetStatus = status;
        if (roundName) {
            if (!targetStatus || targetStatus === "Moved to Next Round" || targetStatus.includes("Next Round")) {
                const roundMatch = roundName.match(/round\s*(\d+)/i);
                if (roundMatch) {
                    targetStatus = `Shortlisted — Round ${roundMatch[1]}`;
                } else if (roundName.toLowerCase().includes("hr")) {
                    targetStatus = "Shortlisted — HR Round";
                } else if (roundName.toLowerCase().includes("tech")) {
                    targetStatus = "Shortlisted — Technical Round";
                } else {
                    targetStatus = `Shortlisted — ${roundName}`;
                }
            }
        }

        const validStatus = normalizeStatus(targetStatus) || targetStatus;
        if (!validStatus) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${HIRING_STAGES.join(", ")}`,
                success: false,
            });
        }

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

        if (!application.job) {
            return res.status(404).json({
                message: "The job opening associated with this application was not found or has been removed.",
                success: false,
            });
        }

        // Authorize: check recruiter ownership of the job or company
        const jobCreatorId = application.job.created_by?._id?.toString() || application.job.created_by?.toString();
        const companyOwnerId = application.job.company?.userId?._id?.toString() || application.job.company?.userId?.toString();
        const currentRecruiterId = recruiterId?.toString();

        const isJobCreator = jobCreatorId === currentRecruiterId;
        const isCompanyOwner = companyOwnerId === currentRecruiterId;

        // Verify that logged-in user is a recruiter
        const recruiterUser = await User.findById(recruiterId);
        if (!recruiterUser || recruiterUser.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can update candidate application statuses.",
                success: false,
            });
        }

        if (!isJobCreator && !isCompanyOwner) {
            return res.status(403).json({
                message: "Unauthorized: You do not have permission to manage applications for this job opening.",
                success: false,
            });
        }

        const previousStatus = application.status;
        const normPrev = normalizeStatus(previousStatus) || previousStatus;
        const normTarget = normalizeStatus(validStatus) || validStatus;

        // 1. Rejected applications cannot advance directly to rounds or selection unless reopened to 'Under Review' or 'Applied'
        if (normPrev === "Rejected" && normTarget !== "Rejected" && normTarget !== "Under Review" && normTarget !== "Applied") {
            return res.status(400).json({
                message: "Rejected applications cannot be advanced directly to interview rounds or selection. Please reopen the application to 'Under Review' first.",
                success: false,
            });
        }

        // 2. Selected applications cannot jump backward into interview rounds
        if (normPrev === "Selected" && (normTarget.includes("Round") || normTarget.includes("Shortlist"))) {
            return res.status(400).json({
                message: "Candidate has already been Selected with an offer. Application cannot be moved backward to intermediate interview rounds.",
                success: false,
            });
        }

        // 3. Withdrawn applications cannot be advanced
        if (normPrev === "Withdrawn" && normTarget !== "Withdrawn") {
            return res.status(400).json({
                message: "This application was withdrawn by the candidate and cannot be progressed.",
                success: false,
            });
        }

        // 4. Deduplication: Prevent duplicate history entries and redundant emails if identical status
        const isSameStatus = normPrev === normTarget;
        const isSameRound = !roundName || roundName === application.currentRound;
        const noNewNotesOrFeedback = !notes && !feedback;
        if (isSameStatus && isSameRound && noNewNotesOrFeedback) {
            return res.status(200).json({
                message: `Application is already at stage '${validStatus}'. No changes were made.`,
                application: application.toObject(),
                emailSent: false,
                success: true,
            });
        }

        application.status = validStatus;

        if (roundName) {
            application.currentRound = roundName;
        }
        if (notes !== undefined) {
            application.internalNotes = notes;
        }
        if (feedback !== undefined) {
            application.feedback = feedback;
        }

        // Append to audit status history with full previous state and event type
        const eventType = normPrev === "Rejected" && (normTarget === "Under Review" || normTarget === "Applied")
            ? "application_reopened"
            : normTarget === "Rejected"
            ? "candidate_rejected"
            : normTarget === "Selected"
            ? "candidate_selected"
            : "stage_advanced";

        application.statusHistory.push({
            status: validStatus,
            previousStatus: previousStatus || "",
            eventType,
            changedAt: new Date(),
            changedBy: recruiterId,
            notes: notes || `Status updated from ${previousStatus} to ${validStatus}`,
            feedback: feedback || "",
        });

        await application.save();

        // Send email notification for meaningful status updates
        let emailResult = { success: false, skipped: true };
        if (
            sendEmail !== false &&
            application.applicant?.email &&
            validStatus !== "Applied" &&
            validStatus !== "Withdrawn"
        ) {
            try {
                emailResult = await sendStatusUpdateEmail({
                    candidateEmail: application.applicant.email,
                    candidateName: application.applicant.fullname,
                    jobTitle: application.job.title,
                    companyName: application.job.company?.companyName || "the hiring team",
                    status: validStatus,
                    notes: notes || "",
                    feedback: feedback || "",
                    customSubject,
                    customMessage,
                    roundName: roundName || validStatus,
                });

                if (emailResult.success) {
                    application.lastEmailSentAt = new Date();
                    application.lastEmailError = null;
                    await Application.findByIdAndUpdate(application._id, {
                        lastEmailSentAt: new Date(),
                        lastEmailError: null,
                    });
                } else if (!emailResult.skipped) {
                    application.lastEmailError = emailResult.error || "Email delivery failed";
                    await Application.findByIdAndUpdate(application._id, {
                        lastEmailError: emailResult.error || "Email delivery failed",
                    });
                }
            } catch (mailErr) {
                console.error("[UpdateStatus] Email error:", mailErr.message);
                emailResult = { success: false, error: mailErr.message };
                await Application.findByIdAndUpdate(application._id, {
                    lastEmailError: mailErr.message,
                });
            }
        }

        // Return updated application populated
        const updatedApp = await Application.findById(applicationId)
            .populate({
                path: "job",
                populate: { path: "company" },
            })
            .populate("applicant", "fullname email phoneNumber profile")
            .populate("statusHistory.changedBy", "fullname role")
            .populate("interviews");

        const appObj = updatedApp.toObject();
        appObj.status = normalizeStatus(appObj.status) || appObj.status;

        let messageText = `Candidate status updated to '${validStatus}'`;
        if (emailResult.success) {
            messageText += " and notification email sent successfully.";
        } else if (emailResult.error) {
            messageText += `. Note: Status saved, but notification email could not be delivered (${emailResult.error}).`;
        }

        return res.status(200).json({
            message: messageText,
            application: appObj,
            emailSent: Boolean(emailResult.success),
            emailError: emailResult.success ? null : (emailResult.error || null),
            success: true,
        });
    } catch (error) {
        console.error("UpdateStatus Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to update application status",
            success: false,
        });
    }
};

// =========================================================================
// 5. Job Seeker & Recruiter: Application Details & Timeline View
// =========================================================================
export const getApplicationDetails = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;

        const application = await Application.findById(applicationId)
            .populate({
                path: "job",
                populate: [
                    { path: "company" },
                    { path: "created_by", select: "fullname email phoneNumber" },
                ],
            })
            .populate("applicant", "fullname email phoneNumber profile")
            .populate("statusHistory.changedBy", "fullname role")
            .populate("interviews");

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false,
            });
        }

        // Authorization: must be applicant or job creator or company owner
        const isApplicant = application.applicant?._id?.toString() === userId?.toString();
        const jobCreatorId = application.job?.created_by?._id?.toString() || application.job?.created_by?.toString();
        const companyOwnerId = application.job?.company?.userId?._id?.toString() || application.job?.company?.userId?.toString();
        const isRecruiter = jobCreatorId === userId?.toString() || companyOwnerId === userId?.toString();

        if (!isApplicant && !isRecruiter) {
            return res.status(403).json({
                message: "Unauthorized to view this application",
                success: false,
            });
        }

        const appObj = application.toObject();
        appObj.status = normalizeStatus(appObj.status) || appObj.status;

        return res.status(200).json({
            application: appObj,
            success: true,
        });
    } catch (error) {
        console.error("GetApplicationDetails Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to load application details",
            success: false,
        });
    }
};

// =========================================================================
// 6. Job Seeker Dashboard Statistics
// =========================================================================
export const getSeekerStats = async (req, res) => {
    try {
        const userId = req.id;

        const applications = await Application.find({ applicant: userId });
        const interviews = await Interview.find({
            candidate: userId,
            status: "Scheduled",
            interviewDate: { $gte: new Date() },
        });

        const stats = {
            totalApplications: applications.length,
            applied: 0,
            underReview: 0,
            accepted: 0,
            shortlisted: 0,
            interviewScheduled: 0,
            selected: 0,
            rejected: 0,
            withdrawn: 0,
            upcomingInterviews: interviews.length,
        };

        applications.forEach((app) => {
            const st = normalizeStatus(app.status) || app.status || "Applied";
            if (st === "Applied") stats.applied++;
            else if (st === "Under Review") stats.underReview++;
            else if (st === "Accepted") stats.accepted++;
            else if (st.includes("Shortlist") || st.includes("Round")) stats.shortlisted++;
            else if (st === "Interview Scheduled") stats.interviewScheduled++;
            else if (st === "Selected") stats.selected++;
            else if (st === "Rejected") stats.rejected++;
            else if (st === "Withdrawn") stats.withdrawn++;
        });

        return res.status(200).json({
            stats,
            success: true,
        });
    } catch (error) {
        console.error("GetSeekerStats Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve statistics",
            success: false,
        });
    }
};

// =========================================================================
// 7. Recruiter Dashboard Statistics
// =========================================================================
export const getRecruiterStats = async (req, res) => {
    try {
        const recruiterId = req.id;

        // Fetch all companies and jobs posted by this recruiter
        const userCompanies = await Company.find({ userId: recruiterId }).select("_id");
        const companyIds = userCompanies.map((c) => c._id);

        const jobs = await Job.find({
            $or: [
                { created_by: recruiterId },
                { company: { $in: companyIds } },
            ],
        });
        const jobIds = jobs.map((j) => j._id);

        const applications = await Application.find({ job: { $in: jobIds } });
        const upcomingInterviews = await Interview.find({
            recruiter: recruiterId,
            status: "Scheduled",
            interviewDate: { $gte: new Date() },
        });

        const stats = {
            totalJobs: jobs.length,
            totalApplicants: applications.length,
            awaitingReview: 0,
            accepted: 0,
            shortlisted: 0,
            interviewScheduled: 0,
            selected: 0,
            rejected: 0,
            upcomingInterviews: upcomingInterviews.length,
        };

        applications.forEach((app) => {
            const st = normalizeStatus(app.status) || app.status || "Applied";
            if (st === "Applied" || st === "Under Review") stats.awaitingReview++;
            else if (st === "Accepted") stats.accepted++;
            else if (st.includes("Shortlist") || st.includes("Round")) stats.shortlisted++;
            else if (st === "Interview Scheduled") stats.interviewScheduled++;
            else if (st === "Selected") stats.selected++;
            else if (st === "Rejected") stats.rejected++;
        });

        return res.status(200).json({
            stats,
            success: true,
        });
    } catch (error) {
        console.error("GetRecruiterStats Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve recruiter stats",
            success: false,
        });
    }
};

// =========================================================================
// 8. Retry Email Delivery for Application
// =========================================================================
export const retryApplicationEmail = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;
        const { customSubject, customMessage } = req.body || {};

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

        // User or job creator or company owner can retry
        const isApplicant = application.applicant?._id?.toString() === userId?.toString();
        const isJobCreator = application.job?.created_by?._id?.toString() === userId?.toString() ||
                            application.job?.created_by?.toString() === userId?.toString();
        const isCompanyOwner = application.job?.company?.userId?._id?.toString() === userId?.toString() ||
                              application.job?.company?.userId?.toString() === userId?.toString();

        if (!isApplicant && !isJobCreator && !isCompanyOwner) {
            return res.status(403).json({
                message: "Unauthorized: You do not have permission to retry emails for this application.",
                success: false,
            });
        }

        const currentStatus = normalizeStatus(application.status) || application.status;
        let emailResult;

        if (currentStatus === "Applied") {
            emailResult = await sendApplicationConfirmationEmail({
                candidateEmail: application.applicant.email,
                candidateName: application.applicant.fullname,
                jobTitle: application.job.title,
                companyName: application.job.company?.companyName || "the hiring team",
                applicationId: application._id,
            });
            if (emailResult.success) {
                application.confirmationEmailSent = true;
            }
        } else {
            emailResult = await sendStatusUpdateEmail({
                candidateEmail: application.applicant.email,
                candidateName: application.applicant.fullname,
                jobTitle: application.job.title,
                companyName: application.job.company?.companyName || "the hiring team",
                status: currentStatus,
                notes: application.internalNotes || "",
                feedback: application.feedback || "",
                customSubject,
                customMessage,
                roundName: application.currentRound || currentStatus,
            });
        }

        if (emailResult.success) {
            application.lastEmailSentAt = new Date();
            application.lastEmailError = null;
            await application.save();

            return res.status(200).json({
                message: "Notification email sent successfully!",
                success: true,
                emailSent: true,
            });
        } else {
            application.lastEmailError = emailResult.error || "Delivery attempt failed";
            await application.save();

            const failureMsg = emailResult.message || emailResult.error || "Failed to deliver email through mail provider";
            return res.status(200).json({
                message: failureMsg,
                error: emailResult.error,
                success: false,
                emailSent: false,
            });
        }
    } catch (error) {
        console.error("RetryApplicationEmail Error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retry email",
            success: false,
        });
    }
};
