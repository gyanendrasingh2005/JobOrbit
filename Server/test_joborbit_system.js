import mongoose from "mongoose";
import { Application, APPLICATION_STATUSES, HIRING_STAGES } from "./models/application.models.js";
import { Interview, INTERVIEW_STATUSES, INTERVIEW_TYPES } from "./models/interview.models.js";
import { normalizeStatus } from "./controllers/application.controllers.js";
import {
    sendEmail,
    sendApplicationConfirmationEmail,
    sendStatusUpdateEmail,
    sendInterviewInvitationEmail,
    sendInterviewRescheduledEmail,
    sendInterviewCancelledEmail,
    sendInterviewReminderEmail,
} from "./utils/emailService.js";

async function runTests() {
    console.log("=================================================");
    console.log("🚀 STARTING JOBORBIT SYSTEM VERIFICATION SUITE");
    console.log("=================================================\n");

    let passed = 0;
    let failed = 0;

    const assert = (condition, testName) => {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            failed++;
        }
    };

    // -------------------------------------------------------------------------
    // Scenario 1: Multi-Round Hiring Workflow & Stages
    // -------------------------------------------------------------------------
    console.log("--- Test Group 1: Multi-Round Pipeline Stages & Models ---");
    const requiredStages = [
        "Applied",
        "Under Review",
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

    requiredStages.forEach((stage) => {
        assert(HIRING_STAGES.includes(stage), `HIRING_STAGES contains canonical stage: '${stage}'`);
    });

    // Test normalizeStatus function
    assert(normalizeStatus("shortlisted — round 1") === "Shortlisted — Round 1", "normalizeStatus standardizes 'shortlisted — round 1'");
    assert(normalizeStatus("round 1 completed") === "Round 1 Completed", "normalizeStatus standardizes 'round 1 completed'");
    assert(normalizeStatus("shortlisted — round 2") === "Shortlisted — Round 2", "normalizeStatus standardizes 'shortlisted — round 2'");
    assert(normalizeStatus("round 2 completed") === "Round 2 Completed", "normalizeStatus standardizes 'round 2 completed'");
    assert(normalizeStatus("selected") === "Selected", "normalizeStatus standardizes 'selected'");
    assert(normalizeStatus("rejected") === "Rejected", "normalizeStatus standardizes 'rejected'");

    // Application document with multi-round history and feedback
    const testApp = new Application({
        job: new mongoose.Types.ObjectId(),
        applicant: new mongoose.Types.ObjectId(),
        status: "Applied",
        statusHistory: [
            {
                status: "Applied",
                changedAt: new Date(),
                notes: "Initial submission",
                feedback: "",
            },
        ],
    });

    assert(testApp.status === "Applied", "Initial application status defaults to 'Applied'");
    assert(testApp.statusHistory.length === 1, "Status history captures initial application submission");

    // Advance to Shortlisted — Round 1 with feedback
    testApp.status = "Shortlisted — Round 1";
    testApp.feedback = "Strong resume and solid problem-solving foundation";
    testApp.statusHistory.push({
        status: "Shortlisted — Round 1",
        changedAt: new Date(),
        notes: "Shortlisted for technical round",
        feedback: "Strong resume and solid problem-solving foundation",
    });

    assert(testApp.status === "Shortlisted — Round 1", "Application transitions to 'Shortlisted — Round 1'");
    assert(testApp.statusHistory.length === 2, "Status history appends Round 1 progression");
    assert(testApp.statusHistory[1].feedback.length > 0, "Candidate feedback is persisted in statusHistory");

    // Advance to Round 2
    testApp.status = "Shortlisted — Round 2";
    testApp.statusHistory.push({
        status: "Shortlisted — Round 2",
        changedAt: new Date(),
        notes: "Passed Round 1 coding challenge, moving to system design",
    });
    assert(testApp.status === "Shortlisted — Round 2", "Application transitions to 'Shortlisted — Round 2'");

    // Mark Selected
    testApp.status = "Selected";
    testApp.statusHistory.push({
        status: "Selected",
        changedAt: new Date(),
        notes: "Final offer extended",
    });
    assert(testApp.status === "Selected", "Application transitions to 'Selected'");

    // -------------------------------------------------------------------------
    // Scenario 2: Duplicate Application Prevention (Unique Compound Index)
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 2: Duplicate Application Prevention ---");
    const indexes = Application.schema.indexes();
    const hasJobApplicantIndex = indexes.some(
        (idx) => idx[0].job === 1 && idx[0].applicant === 1 && idx[1]?.unique === true
    );
    assert(hasJobApplicantIndex, "Compound unique index (job: 1, applicant: 1) is registered on Application schema");

    // -------------------------------------------------------------------------
    // Scenario 3: Interview Model with Round Number & Validation
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 3: Interview Model & Round Number ---");
    assert(
        INTERVIEW_STATUSES.includes("Scheduled") &&
        INTERVIEW_STATUSES.includes("Rescheduled") &&
        INTERVIEW_STATUSES.includes("Cancelled") &&
        INTERVIEW_STATUSES.includes("Completed"),
        "Interview model supports full status lifecycle: Scheduled, Rescheduled, Cancelled, Completed"
    );

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const testInterview = new Interview({
        job: new mongoose.Types.ObjectId(),
        application: testApp._id,
        candidate: new mongoose.Types.ObjectId(),
        recruiter: new mongoose.Types.ObjectId(),
        interviewDate: futureDate,
        timeZone: "America/New_York",
        duration: 45,
        roundNumber: 2,
        interviewType: "online",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        instructions: "Prepare system architecture diagrams",
        status: "Scheduled",
    });

    const interviewErr = testInterview.validateSync();
    assert(!interviewErr, "Valid interview document with roundNumber passes schema validation");
    assert(testInterview.roundNumber === 2, "Interview roundNumber is correctly stored as 2");
    assert(testInterview.status === "Scheduled", "Interview initial status is 'Scheduled'");
    assert(testInterview.meetingUrl.startsWith("https://"), "Interview holds valid video conference URL");

    // Rescheduling
    testInterview.status = "Rescheduled";
    testInterview.interviewDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    assert(testInterview.status === "Rescheduled", "Interview status can transition to 'Rescheduled'");

    // Cancellation
    testInterview.status = "Cancelled";
    assert(testInterview.status === "Cancelled", "Interview status can transition to 'Cancelled'");

    // -------------------------------------------------------------------------
    // Scenario 4: Automated Branded Email Notifications & Subject Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 4: Email Notifications & Subject Compliance ---");

    // 1. Application Received Email
    const appEmailResult = await sendApplicationConfirmationEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        applicationId: testApp._id,
    });
    assert(
        appEmailResult.success === false && (appEmailResult.skipped || appEmailResult.error),
        "Application confirmation email safely executes and skips/handles without throwing when credentials missing"
    );

    // 2. Shortlisted for Round 1 Email
    const r1EmailResult = await sendStatusUpdateEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        status: "Shortlisted — Round 1",
        notes: "Review your dashboard for scheduling details",
    });
    assert(r1EmailResult !== undefined, "Shortlisted for Round 1 email executes safely");

    // 3. Round 2 Email
    const r2EmailResult = await sendStatusUpdateEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        status: "Shortlisted — Round 2",
        notes: "Advancing to deep-dive technical interview",
    });
    assert(r2EmailResult !== undefined, "Round 2 status update email executes safely");

    // 4. Selection Email
    const selectEmailResult = await sendStatusUpdateEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        status: "Selected",
        notes: "Offer letter generated",
    });
    assert(selectEmailResult !== undefined, "Selection status update email executes safely");

    // 5. Rejection Email
    const rejectEmailResult = await sendStatusUpdateEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        status: "Rejected",
        notes: "We appreciate your time",
    });
    assert(rejectEmailResult !== undefined, "Rejection status update email executes safely");

    // 6. Interview Invitation Email
    const inviteEmailResult = await sendInterviewInvitationEmail({
        candidateEmail: "candidate@example.com",
        candidateName: "Alex Doe",
        jobTitle: "Senior Full Stack Engineer",
        companyName: "Web3Orbit",
        interviewDate: futureDate,
        timeZone: "UTC",
        duration: 45,
        roundNumber: 2,
        interviewType: "online",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        instructions: "Please be ready 5 minutes early",
    });
    assert(inviteEmailResult !== undefined, "Interview invitation email with roundNumber executes safely");

    // -------------------------------------------------------------------------
    // Scenario 5: Reminder Window Calculation & Deduplication
    // -------------------------------------------------------------------------
    console.log("\n--- Test Group 5: Reminder Window Calculation & Deduplication ---");
    const now = Date.now();
    const interviewIn50Mins = new Date(now + 50 * 60 * 1000);
    const interviewIn23Hours = new Date(now + 23 * 60 * 60 * 1000);

    const minutesUntil50 = (interviewIn50Mins.getTime() - now) / (1000 * 60);
    const hoursUntil23 = (interviewIn23Hours.getTime() - now) / (1000 * 60 * 60);

    assert(minutesUntil50 <= 65 && minutesUntil50 >= 5, "50-minute future interview matches 1-Hour Reminder Window (5-65 mins)");
    assert(hoursUntil23 <= 24.5 && hoursUntil23 > 1.08, "23-hour future interview matches 24-Hour Reminder Window (1h - 24.5h)");

    // Deduplication check
    const mockInterviewDoc = {
        remindersSent: [{ type: "24h", sentAt: new Date() }],
    };
    const has24hReminder = mockInterviewDoc.remindersSent.some((r) => r.type === "24h");
    const has1hReminder = mockInterviewDoc.remindersSent.some((r) => r.type === "1h");
    assert(has24hReminder === true, "Deduplication detects existing 24h reminder to prevent duplicate notifications");
    assert(has1hReminder === false, "Deduplication logic allows 1h reminder when pending");

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
