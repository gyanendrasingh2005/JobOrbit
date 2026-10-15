import { Job } from "../models/job.models.js";
import { Application } from "../models/application.models.js";


// role === "recruiter"

export const postJob = async (req, res) => {
    try {
        const { title, description, location, requirements, salary, jobType, experience, position, companyId } = req.body;

        const userId = req.id;

        if (!title || !description || !location || !requirements || !salary || !jobType || experience < 0 || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing",
                success: false,
            })
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
        });

        return res.status(201).json({
            message: "New job created",
            job,
            success: true,
        })

    } catch (error) {
        console.log(error);
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

        const job = await Job.findById(jobId).populate(
            {
                path: "applications",
            }
        );
        if (!job) {
            res.status(404).json({
                message: "Job not found",
                success: false,
            })
        }

        return res.status(200).json({
            message: "Job found",
            job,
            success: true,
        })

    } catch (error) {
        console.log(error);
    }
}


// role === "recruiter"

export const getRecruiterJobs = async (req, res) => {
    try {
        const recruiterId = req.id;
        const jobs = await Job.find({ created_by: recruiterId }).populate(
            {
                path: "company",
                createdAt: -1,
            }
        );
        if (!jobs) {
            return res.status(404).json({
                message: "No jobs found",
                success: false,
            })
        }

        return res.status(200).json({
            message: "Jobs found",
            jobs,
            success: true,
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message || "Failed to fetch recruiter jobs",
            success: false,
        });
    }
}

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

