import { Job } from "../models/job.models.js";
import { Application } from "../models/application.models.js";
import { Company } from "../models/company.models.js";


// role === "recruiter"

export const postJob = async (req, res) => {
    try {
        const { title, description, location, requirements, salary, jobType, experience, position, companyId, totalRounds, interviewRounds } = req.body;

        const userId = req.id;

        if (!title || !description || !location || !requirements || !salary || !jobType || experience < 0 || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing",
                success: false,
            })
        }

        const parsedTotalRounds = totalRounds ? Math.max(1, Math.min(10, Number(totalRounds))) : 3;
        let parsedInterviewRounds = [];
        if (Array.isArray(interviewRounds) && interviewRounds.length > 0) {
            parsedInterviewRounds = interviewRounds.map((r, idx) => ({
                roundNumber: idx + 1,
                name: typeof r === "string" ? r.trim() : (r.name ? r.name.trim() : `Round ${idx + 1}`),
                description: typeof r === "object" ? (r.description || "") : "",
            }));
        } else {
            parsedInterviewRounds = Array.from({ length: parsedTotalRounds }, (_, i) => ({
                roundNumber: i + 1,
                name: `Round ${i + 1}`,
                description: "",
            }));
        }

        const job = await Job.create({
            title,
            description,
            location,
            requirements: requirements.split(","),
            salary: Number(salary),
            jobType,
            experienceLevel: experience,
            position,
            company: companyId,
            created_by: userId,
            totalRounds: parsedInterviewRounds.length || parsedTotalRounds,
            interviewRounds: parsedInterviewRounds,
        });

        return res.status(201).json({
            message: "New job created",
            job,
            success: true,
        })

    } catch (error) {
        console.error("PostJob Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to create job",
            success: false,
        });
    }
}


// role === "student"

export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword ? req.query.keyword.trim() : "";
        let query = {};
        if (keyword) {
            query = {
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                    { location: { $regex: keyword, $options: "i" } },
                    { requirements: { $regex: keyword, $options: "i" } },
                ]
            };
        }

        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: jobs.length > 0 ? "Jobs found" : "No jobs found",
            jobs: jobs || [],
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message || "Failed to fetch jobs",
            success: false,
        });
    }
}


// role === "student"

export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        const job = await Job.findById(jobId).populate("company");
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false,
            });
        }

        // Accurately query applications from the primary Application collection
        const applications = await Application.find({ job: jobId })
            .select("_id applicant status createdAt")
            .populate("applicant", "fullname email");

        // Keep job document applications array consistent
        const appIds = applications.map((a) => a._id);
        if (job.applications?.length !== appIds.length) {
            job.applications = appIds;
            await job.save().catch(() => {});
        }

        return res.status(200).json({
            message: "Job found",
            job: {
                ...job.toObject(),
                applications,
                applicantCount: applications.length,
            },
            success: true,
        });
    } catch (error) {
        console.error("GetJobById error:", error.message);
        return res.status(500).json({
            message: error.message || "Failed to retrieve job",
            success: false,
        });
    }
};


// role === "recruiter"

export const getRecruiterJobs = async (req, res) => {
    try {
        const recruiterId = req.id;

        // Find companies owned by recruiter
        const userCompanies = await Company.find({ userId: recruiterId }).select("_id");
        const companyIds = userCompanies.map((c) => c._id);

        const jobs = await Job.find({
            $or: [
                { created_by: recruiterId },
                { company: { $in: companyIds } },
            ],
        })
            .populate("company")
            .sort({ createdAt: -1 });

        // Calculate accurate real-time applicant counts for each job
        const jobIds = jobs.map((j) => j._id);
        const appCounts = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: "$job", count: { $sum: 1 } } },
        ]);

        const countMap = {};
        appCounts.forEach((ac) => {
            countMap[ac._id.toString()] = ac.count;
        });

        const enrichedJobs = jobs.map((job) => {
            const jObj = job.toObject();
            const realCount = countMap[job._id.toString()] || 0;
            jObj.applicantCount = realCount;
            jObj.totalApplicants = realCount;
            return jObj;
        });

        return res.status(200).json({
            message: enrichedJobs.length > 0 ? "Jobs found" : "No jobs found",
            jobs: enrichedJobs,
            success: true,
        });
    } catch (error) {
        console.error("GetRecruiterJobs Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch recruiter jobs",
            success: false,
        });
    }
};

// Update Job (Recruiter only)
export const updateJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.id;
        const { title, description, location, requirements, salary, jobType, experience, experienceLevel, position, companyId } = req.body;

        let job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false,
            });
        }

        // Verify that the user is the creator of the job
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to update this job",
                success: false,
            });
        }

        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (location !== undefined) job.location = location;
        if (salary !== undefined) job.salary = Number(salary);
        if (jobType !== undefined) job.jobType = jobType;
        if (experience !== undefined || experienceLevel !== undefined) {
            job.experienceLevel = Number(experience !== undefined ? experience : experienceLevel);
        }
        if (position !== undefined) job.position = Number(position);
        if (companyId) job.company = companyId;

        if (requirements !== undefined) {
            if (Array.isArray(requirements)) {
                job.requirements = requirements;
            } else if (typeof requirements === "string") {
                job.requirements = requirements.split(",").map(r => r.trim()).filter(Boolean);
            }
        }

        await job.save();

        const updatedJob = await Job.findById(jobId).populate("company");

        return res.status(200).json({
            message: "Job updated successfully",
            job: updatedJob,
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message || "Failed to update job",
            success: false,
        });
    }
};

// Delete Job (Recruiter only)
export const deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false,
            });
        }

        // Verify that the user is the creator of the job
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this job",
                success: false,
            });
        }

        // Delete associated applications
        await Application.deleteMany({ job: jobId });

        // Delete the job itself
        await Job.findByIdAndDelete(jobId);

        return res.status(200).json({
            message: "Job deleted successfully",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message || "Failed to delete job",
            success: false,
        });
    }
};

