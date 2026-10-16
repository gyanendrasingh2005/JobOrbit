import express from "express";
import {
    scheduleInterview,
    rescheduleInterview,
    cancelInterview,
    getMyInterviews,
    getInterviewsByApplication,
} from "../controllers/interview.controllers.js";
import authUser from "../middlewares/authUser.js";

const interviewRouter = express.Router();

interviewRouter.post("/schedule", authUser, scheduleInterview);
interviewRouter.put("/:id/reschedule", authUser, rescheduleInterview);
interviewRouter.put("/:id/cancel", authUser, cancelInterview);
interviewRouter.get("/my-interviews", authUser, getMyInterviews);
interviewRouter.get("/application/:applicationId", authUser, getInterviewsByApplication);

export default interviewRouter;
