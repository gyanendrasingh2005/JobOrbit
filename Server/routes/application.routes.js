import express from "express";
import {
    applyJob,
    getApplicants,
    getAllRecruiterApplicants,
    getAppliedJobs,
    updateStatus,
    getApplicationDetails,
    getSeekerStats,
    getRecruiterStats,
    retryApplicationEmail,
} from "../controllers/application.controllers.js";
import authUser from "../middlewares/authUser.js";

const applicationRouter = express.Router();

// Job Seeker routes
applicationRouter.post("/apply/:id", authUser, applyJob);
applicationRouter.get("/get", authUser, getAppliedJobs);
applicationRouter.get("/seeker/stats", authUser, getSeekerStats);
applicationRouter.get("/details/:id", authUser, getApplicationDetails);
applicationRouter.post("/:id/retry-email", authUser, retryApplicationEmail);

// Recruiter routes
applicationRouter.get("/recruiter/stats", authUser, getRecruiterStats);
applicationRouter.get("/recruiter/all", authUser, getAllRecruiterApplicants);
applicationRouter.get("/recruiter/applicants", authUser, getAllRecruiterApplicants);
applicationRouter.get("/:id/applicants", authUser, getApplicants);
applicationRouter.post("/status/:id/update", authUser, updateStatus);
applicationRouter.put("/status/:id/update", authUser, updateStatus);
applicationRouter.patch("/status/:id/update", authUser, updateStatus);
applicationRouter.post("/:id/status", authUser, updateStatus);
applicationRouter.put("/:id/status", authUser, updateStatus);
applicationRouter.patch("/:id/status", authUser, updateStatus);

export default applicationRouter;
