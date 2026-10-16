import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import { User } from "./models/user.model.js";
import { Job } from "./models/job.models.js";
import { Company } from "./models/company.models.js";
import { Application, HIRING_STAGES, APPLICATION_STATUSES } from "./models/application.models.js";
import { Interview } from "./models/interview.models.js";
import {
    applyJob,
    getApplicants,
    getAllRecruiterApplicants,
    getAppliedJobs,
    updateStatus,
    getSeekerStats,
    getRecruiterStats,
    normalizeStatus,
} from "./controllers/application.controllers.js";
import { postJob, getRecruiterJobs } from "./controllers/job.controllers.js";
import {
    scheduleInterview,
    rescheduleInterview,
    cancelInterview,
} from "./controllers/interview.controllers.js";
import { updateCompany, getCompanyDetailsById } from "./controllers/company.controllers.js";
import { toggleBookmark, getBookmarkedJobs } from "./controllers/user.controllers.js";
import authUser from "./middlewares/authUser.js";
import jwt from "jsonwebtoken";

dotenv.config();

// Helper to mock Express req, res
const mockReqRes = (params = {}, body = {}, query = {}, userId = null) => {
    let statusCode = 200;
    let responseData = null;

    const req = {
        params,
        body,
        query,
        id: userId,
        cookies: {},
        headers: {},
    };

    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        },
        cookie() {
            return this;
        },
        getStatusCode() {
            return statusCode;
        },
        getData() {
            return responseData;
        },
    };

    return { req, res };
};

async function runEndToEndVerification() {
    console.log("=================================================");
    console.log("🚀 JOBORBIT COMPREHENSIVE END-TO-END VERIFICATION");
    console.log("=================================================\n");

    await connectDB();

    let passed = 0;
    let failed = 0;

    const assert = (condition, title) => {
        if (condition) {
            console.log(`✅ PASS: ${title}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${title}`);
            failed++;
        }
    };

    try {
        // Find existing test users
        const recruiter = await User.findOne({ email: "gyan@gmail.com", role: "recruiter" });
        assert(Boolean(recruiter), "Recruiter account found (gyan@gmail.com)");

        const seeker = await User.findOne({ email: "ashu@gmail.com", role: "student" });
        assert(Boolean(seeker), "Job seeker account found (ashu@gmail.com)");

        // Ensure seeker has a resume for testing applications
        if (!seeker.profile?.resume) {
            seeker.profile = seeker.profile || {};
            seeker.profile.resume = "https://res.cloudinary.com/demo/image/upload/sample_resume.pdf";
            seeker.profile.resumeOriginalName = "ashu_resume.pdf";
            await seeker.save();
        }

        const company = await Company.findOne({ userId: recruiter._id });
        assert(Boolean(company), `Recruiter company found (${company?.companyName})`);

        // -----------------------------------------------------------------
        // Scenario 1: Recruiter creates and publishes a job
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 1: Recruiter creates and publishes a job ---");
        const jobTitle = `E2E Senior Full Stack Engineer - ${Date.now()}`;
        const { req: postReq, res: postRes } = mockReqRes(
            {},
            {
                title: jobTitle,
                description: "Full stack engineering role with Node, React, and MongoDB.",
                location: "Bengaluru, India (Hybrid)",
                requirements: "React,Node.js,MongoDB,Express,TypeScript",
                salary: "24",
                jobType: "Full Time",
                experience: 3,
                position: 2,
                companyId: company._id.toString(),
            },
            {},
            recruiter._id.toString()
        );

        await postJob(postReq, postRes);
        assert(postRes.getStatusCode() === 201, "Job posted successfully via API (HTTP 201)");
        const createdJobId = postRes.getData()?.job?._id;
        assert(Boolean(createdJobId), `New Job ID generated: ${createdJobId}`);

        // -----------------------------------------------------------------
        // Scenario 2 & 3: Job seeker applies for the job
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 2 & 3: Job seeker applies for the job ---");
        const { req: applyReq, res: applyRes } = mockReqRes(
            { id: createdJobId.toString() },
            {},
            {},
            seeker._id.toString()
        );

        await applyJob(applyReq, applyRes);
        assert(applyRes.getStatusCode() === 201, "Application submitted successfully (HTTP 201)");
        const createdAppId = applyRes.getData()?.application?._id;
        assert(Boolean(createdAppId), `Application created with ID: ${createdAppId}`);

        // -----------------------------------------------------------------
        // Scenario 4 & 5: Recruiter views applicants and counts match
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 4 & 5: Recruiter views applicants & counts match ---");
        const { req: appListReq, res: appListRes } = mockReqRes(
            { id: createdJobId.toString() },
            {},
            {},
            recruiter._id.toString()
        );
        await getApplicants(appListReq, appListRes);
        assert(appListRes.getStatusCode() === 200, "getApplicants returned HTTP 200");
        const fetchedJob = appListRes.getData()?.job;
        assert(fetchedJob.applications.length === 1, "Job has exactly 1 application in list");
        assert(fetchedJob.applicantCount === 1, "Job applicantCount matches application list (1)");
        assert(
            fetchedJob.applications[0].applicant.email === seeker.email,
            `Application correctly references seeker email: ${seeker.email}`
        );

        // Test getRecruiterJobs live counts
        const { req: recJobsReq, res: recJobsRes } = mockReqRes(
            {},
            {},
            {},
            recruiter._id.toString()
        );
        await getRecruiterJobs(recJobsReq, recJobsRes);
        const myJobs = recJobsRes.getData()?.jobs || [];
        const currentJobInList = myJobs.find((j) => j._id.toString() === createdJobId.toString());
        assert(Boolean(currentJobInList), "Created job is listed in getRecruiterJobs");
        assert(
            currentJobInList?.applicantCount === 1,
            `getRecruiterJobs reflects live applicantCount: ${currentJobInList?.applicantCount}`
        );

        // Test getAllRecruiterApplicants across all owned jobs
        const { req: allRecAppsReq, res: allRecAppsRes } = mockReqRes(
            {},
            {},
            { jobId: createdJobId.toString() },
            recruiter._id.toString()
        );
        await getAllRecruiterApplicants(allRecAppsReq, allRecAppsRes);
        assert(allRecAppsRes.getStatusCode() === 200, "getAllRecruiterApplicants returned HTTP 200");
        const allAppsData = allRecAppsRes.getData();
        assert(allAppsData.total === 1, `Total applicants for job is 1 (matches total: ${allAppsData.total})`);
        assert(allAppsData.applications.length === 1, "Returned applications list length matches 1");
        assert(
            allAppsData.applications[0].job.company.companyName === company.companyName,
            `Company correctly resolved from DB: ${company.companyName}`
        );

        // -----------------------------------------------------------------
        // Scenario 6 & 7: Recruiter accepts candidate for consideration
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 6 & 7: Recruiter accepts candidate for consideration ---");
        const { req: acceptReq, res: acceptRes } = mockReqRes(
            { id: createdAppId.toString() },
            { status: "Accepted", feedback: "Profile and resume accepted for interview rounds." },
            {},
            recruiter._id.toString()
        );
        await updateStatus(acceptReq, acceptRes);
        assert(acceptRes.getStatusCode() === 200, "updateStatus to 'Accepted' returned HTTP 200");
        assert(
            acceptRes.getData()?.application?.status === "Accepted",
            "Application status successfully set to 'Accepted'"
        );

        // Verify persistence from DB directly
        const dbAppAfterAccept = await Application.findById(createdAppId);
        assert(dbAppAfterAccept.status === "Accepted", "Status 'Accepted' persisted in MongoDB");
        assert(
            dbAppAfterAccept.statusHistory.some((h) => h.status === "Accepted"),
            "statusHistory recorded 'Accepted' stage transition"
        );

        // -----------------------------------------------------------------
        // Scenario 8: Recruiter shortlists candidate for Round 1
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 8: Recruiter shortlists for Round 1 ---");
        const { req: shortReq, res: shortRes } = mockReqRes(
            { id: createdAppId.toString() },
            { status: "Shortlisted — Round 1", feedback: "Shortlisted for Round 1 technical screening" },
            {},
            recruiter._id.toString()
        );
        await updateStatus(shortReq, shortRes);
        assert(shortRes.getStatusCode() === 200, "updateStatus to 'Shortlisted — Round 1' returned HTTP 200");
        assert(
            shortRes.getData()?.application?.status === "Shortlisted — Round 1",
            "Returned status is 'Shortlisted — Round 1'"
        );

        // -----------------------------------------------------------------
        // Scenario 9, 10, 11: Schedule, Reschedule, Cancel Interview
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 9: Schedule Interview ---");
        const interviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
        const { req: schedReq, res: schedRes } = mockReqRes(
            {},
            {
                applicationId: createdAppId.toString(),
                interviewDate: interviewDate.toISOString(),
                timeZone: "Asia/Kolkata",
                duration: 60,
                roundNumber: 1,
                interviewType: "online",
                meetingUrl: "https://meet.google.com/abc-defg-hij",
                instructions: "Please be ready with your code editor.",
            },
            {},
            recruiter._id.toString()
        );
        await scheduleInterview(schedReq, schedRes);
        assert(schedRes.getStatusCode() === 201, "scheduleInterview returned HTTP 201");
        const interviewId = schedRes.getData()?.interview?._id;
        assert(Boolean(interviewId), `Interview created with ID: ${interviewId}`);

        // Reschedule Interview
        console.log("\n--- Scenario 10: Reschedule Interview ---");
        const newInterviewDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days later
        const { req: reschedReq, res: reschedRes } = mockReqRes(
            { id: interviewId.toString() },
            {
                newDate: newInterviewDate.toISOString(),
                duration: 45,
                meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
            },
            {},
            recruiter._id.toString()
        );
        await rescheduleInterview(reschedReq, reschedRes);
        assert(reschedRes.getStatusCode() === 200, "rescheduleInterview returned HTTP 200");
        const dbInterview = await Interview.findById(interviewId);
        assert(dbInterview.status === "Rescheduled", "Interview status in DB is 'Rescheduled'");

        // Cancel Interview
        console.log("\n--- Scenario 11: Cancel Interview ---");
        const { req: cancelReq, res: cancelRes } = mockReqRes(
            { id: interviewId.toString() },
            { reason: "Candidate requested rescheduling to later round" },
            {},
            recruiter._id.toString()
        );
        await cancelInterview(cancelReq, cancelRes);
        assert(cancelRes.getStatusCode() === 200, "cancelInterview returned HTTP 200");
        const dbInterviewCancelled = await Interview.findById(interviewId);
        assert(dbInterviewCancelled.status === "Cancelled", "Interview status in DB is 'Cancelled'");

        // -----------------------------------------------------------------
        // Scenario 12: Advance Candidate through Rounds to Selected
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 12: Advance Candidate through Pipeline to Selected ---");
        const advanceStages = [
            "Round 1 Completed",
            "Shortlisted — Round 2",
            "Round 2 Completed",
            "Shortlisted — Round 3",
            "Round 3 Completed",
            "Selected",
        ];

        for (const stage of advanceStages) {
            const { req: stReq, res: stRes } = mockReqRes(
                { id: createdAppId.toString() },
                { status: stage, feedback: `Advanced to ${stage}` },
                {},
                recruiter._id.toString()
            );
            await updateStatus(stReq, stRes);
            assert(stRes.getStatusCode() === 200, `Advanced to '${stage}' returned HTTP 200`);
            assert(stRes.getData()?.application?.status === stage, `Status confirmed as '${stage}'`);
        }

        const finalAppInDb = await Application.findById(createdAppId);
        assert(finalAppInDb.status === "Selected", "Final application status in MongoDB is 'Selected'");
        assert(finalAppInDb.statusHistory.length >= 8, `statusHistory has ${finalAppInDb.statusHistory.length} audit entries`);

        // -----------------------------------------------------------------
        // Scenario 13: Unauthorized requests are rejected
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 13: Unauthorized requests rejected (HTTP 403) ---");
        const otherRecruiter = await User.findOne({ email: "recruiter@careerconnect.com" });
        if (otherRecruiter) {
            const { req: unauthReq, res: unauthRes } = mockReqRes(
                { id: createdAppId.toString() },
                { status: "Rejected" },
                {},
                otherRecruiter._id.toString()
            );
            await updateStatus(unauthReq, unauthRes);
            assert(
                unauthRes.getStatusCode() === 403,
                `Unauthorized recruiter cannot modify application (HTTP ${unauthRes.getStatusCode()})`
            );
        }

        // Job seeker trying to update status
        const { req: seekerHackReq, res: seekerHackRes } = mockReqRes(
            { id: createdAppId.toString() },
            { status: "Selected" },
            {},
            seeker._id.toString()
        );
        await updateStatus(seekerHackReq, seekerHackRes);
        assert(
            seekerHackRes.getStatusCode() === 403,
            `Job seeker cannot update status (HTTP ${seekerHackRes.getStatusCode()})`
        );

        // -----------------------------------------------------------------
        // Scenario 14: Job seeker sees updated progress on their dashboard
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 14: Job seeker sees updated progress ---");
        const { req: seekerDashReq, res: seekerDashRes } = mockReqRes(
            {},
            {},
            {},
            seeker._id.toString()
        );
        await getAppliedJobs(seekerDashReq, seekerDashRes);
        assert(seekerDashRes.getStatusCode() === 200, "getAppliedJobs returned HTTP 200");
        const seekerApps = seekerDashRes.getData()?.application || [];
        const myApp = seekerApps.find((a) => a._id.toString() === createdAppId.toString());
        assert(Boolean(myApp), "Seeker sees their application");
        assert(myApp?.status === "Selected", `Seeker sees accurate final status: ${myApp?.status}`);

        const { req: seekerStatsReq, res: seekerStatsRes } = mockReqRes(
            {},
            {},
            {},
            seeker._id.toString()
        );
        await getSeekerStats(seekerStatsReq, seekerStatsRes);
        assert(seekerStatsRes.getStatusCode() === 200, "getSeekerStats returned HTTP 200");
        assert(seekerStatsRes.getData()?.stats?.selected >= 1, "Seeker stats count matches selected >= 1");

        // -----------------------------------------------------------------
        // Scenario 15: Recruiter dashboard statistics match
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 15: Recruiter dashboard statistics match ---");
        const { req: recStatsReq, res: recStatsRes } = mockReqRes(
            {},
            {},
            {},
            recruiter._id.toString()
        );
        await getRecruiterStats(recStatsReq, recStatsRes);
        assert(recStatsRes.getStatusCode() === 200, "getRecruiterStats returned HTTP 200");
        const recStats = recStatsRes.getData()?.stats;
        assert(recStats?.selected >= 1, `Recruiter stats show selected: ${recStats?.selected}`);

        // -----------------------------------------------------------------
        // Scenario 16: Company Authorization & IDOR Protection
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 16: Company Authorization & IDOR Protection ---");
        const { req: idorReq, res: idorRes } = mockReqRes(
            { id: company._id.toString() },
            { companyName: "Malicious Hack Attempt" },
            {},
            seeker._id.toString() // Seeker is NOT the company owner!
        );
        await updateCompany(idorReq, idorRes);
        assert(idorRes.getStatusCode() === 403, `Unauthorized user blocked from updating company (HTTP ${idorRes.getStatusCode()})`);

        // Owner updating company succeeds
        const { req: ownerCompReq, res: ownerCompRes } = mockReqRes(
            { id: company._id.toString() },
            { description: "Leading Web3 Company" },
            {},
            recruiter._id.toString()
        );
        await updateCompany(ownerCompReq, ownerCompRes);
        assert(ownerCompRes.getStatusCode() === 200, `Owner successfully updates company (HTTP ${ownerCompRes.getStatusCode()})`);

        // -----------------------------------------------------------------
        // Scenario 17: Job Posting Validation & Error Handling
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 17: Job Posting Validation & Error Handling ---");
        const { req: invalidJobReq, res: invalidJobRes } = mockReqRes(
            {},
            { title: "Missing fields job" }, // missing description, location, etc.
            {},
            recruiter._id.toString()
        );
        await postJob(invalidJobReq, invalidJobRes);
        assert(invalidJobRes.getStatusCode() === 400, `Missing required fields rejected with HTTP 400 (HTTP ${invalidJobRes.getStatusCode()})`);

        // -----------------------------------------------------------------
        // Scenario 18: Seeker Job Bookmark Workflow
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 18: Seeker Job Bookmark Workflow ---");
        const { req: bmarkReq, res: bmarkRes } = mockReqRes(
            { id: createdJobId.toString() },
            {},
            {},
            seeker._id.toString()
        );
        await toggleBookmark(bmarkReq, bmarkRes);
        assert(bmarkRes.getStatusCode() === 200, "toggleBookmark returns HTTP 200");
        assert(bmarkRes.getData()?.isBookmarked === true, "Job successfully bookmarked");

        // Toggle again to remove bookmark
        const { req: unbmarkReq, res: unbmarkRes } = mockReqRes(
            { id: createdJobId.toString() },
            {},
            {},
            seeker._id.toString()
        );
        await toggleBookmark(unbmarkReq, unbmarkRes);
        assert(unbmarkRes.getStatusCode() === 200, "toggleBookmark un-bookmark returns HTTP 200");
        assert(unbmarkRes.getData()?.isBookmarked === false, "Job successfully removed from bookmarks");

        // -----------------------------------------------------------------
        // Scenario 19: Authentication & JWT Verification
        // -----------------------------------------------------------------
        console.log("\n--- Scenario 19: Authentication & JWT Verification ---");
        // Test authUser with missing token
        let authNextCalled = false;
        const mockAuthReq = { headers: {}, cookies: {} };
        const mockAuthRes = {
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.data = data;
                return this;
            },
        };
        await authUser(mockAuthReq, mockAuthRes, () => { authNextCalled = true; });
        assert(mockAuthRes.statusCode === 401, `Missing token rejected with HTTP 401 (HTTP ${mockAuthRes.statusCode})`);
        assert(authNextCalled === false, "Next was not called on missing token");

        // Test authUser with valid token
        const validToken = jwt.sign({ userId: seeker._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
        let validAuthNextCalled = false;
        const mockValidReq = { headers: { authorization: `Bearer ${validToken}` }, cookies: {} };
        const mockValidRes = { status() { return this; }, json() { return this; } };
        await authUser(mockValidReq, mockValidRes, () => { validAuthNextCalled = true; });
        assert(validAuthNextCalled === true, "Valid Bearer token successfully verified by authUser middleware");
        assert(mockValidReq.id.toString() === seeker._id.toString(), "req.id properly set to authenticated user ID");

        // Clean up test records
        await Interview.findByIdAndDelete(interviewId);
        await Application.findByIdAndDelete(createdAppId);
        await Job.findByIdAndDelete(createdJobId);
        console.log("\n🧹 Cleaned up temporary test job, application, and interview records.");

        console.log("\n=================================================");
        console.log(`TOTAL TESTS: ${passed + failed}`);
        console.log(`PASSED: ${passed}`);
        console.log(`FAILED: ${failed}`);
        console.log("=================================================");

        if (failed === 0) {
            console.log("\n🎉 ALL 15 VERIFICATION SCENARIOS PASSED WITH FLYING COLORS!");
        } else {
            console.error(`\n⚠️ ${failed} tests failed.`);
        }
    } catch (err) {
        console.error("Verification error:", err);
    } finally {
        process.exit(0);
    }
}

runEndToEndVerification();
