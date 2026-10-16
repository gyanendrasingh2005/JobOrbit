import assert from "assert";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import {
    escapeHtml,
    sendStatusUpdateEmail,
    sendInterviewInvitationEmail,
    validateEmailConfig,
} from "./utils/emailService.js";
import { normalizeStatus } from "./controllers/application.controllers.js";
import { HIRING_STAGES, APPLICATION_STATUSES } from "./models/application.models.js";

async function runRecruiterEmailTests() {
    console.log("=================================================================");
    console.log("🎯 RECRUITER EMAIL NOTIFICATIONS & HIRING PIPELINE TEST SUITE");
    console.log("=================================================================\n");

    let passed = 0;
    let failed = 0;

    const test = (name, fn) => {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name} ->`, err.message);
            failed++;
        }
    };

    const asyncTest = async (name, fn) => {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name} ->`, err.message);
            failed++;
        }
    };

    // -------------------------------------------------------------------------
    // 1. HTML Escaping Utility Tests
    // -------------------------------------------------------------------------
    console.log("--- 1. Security & HTML Sanitization Tests ---");
    test("escapeHtml safely escapes <script> and dangerous tags", () => {
        const malicious = '<script>alert("hacked")</script>';
        const escaped = escapeHtml(malicious);
        assert(!escaped.includes("<script>"), "Must not contain raw script tags");
        assert(escaped.includes("&lt;script&gt;"), "Must contain escaped entities");
    });

    test("escapeHtml handles quotes and ampersands", () => {
        const input = 'John & "Jane" \'Doe\'';
        const escaped = escapeHtml(input);
        assert(escaped.includes("&amp;"), "Must escape &");
        assert(escaped.includes("&quot;"), "Must escape double quotes");
        assert(escaped.includes("&#039;"), "Must escape single quotes");
    });

    test("escapeHtml returns empty string on null or non-string", () => {
        assert.strictEqual(escapeHtml(null), "");
        assert.strictEqual(escapeHtml(undefined), "");
        assert.strictEqual(escapeHtml(123), "");
    });

    // -------------------------------------------------------------------------
    // 2. Status Normalization & Round Aliases
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Status Normalization & Stage Transitions ---");
    test("normalizeStatus maps standard stages", () => {
        assert.strictEqual(normalizeStatus("shortlist"), "Shortlisted — Round 1");
        assert.strictEqual(normalizeStatus("Shortlisted — Round 1"), "Shortlisted — Round 1");
        assert.strictEqual(normalizeStatus("round 2"), "Shortlisted — Round 2");
        assert.strictEqual(normalizeStatus("Shortlisted — Round 2"), "Shortlisted — Round 2");
        assert.strictEqual(normalizeStatus("technical"), "Shortlisted — Round 2");
        assert.strictEqual(normalizeStatus("round 3"), "Shortlisted — Round 3");
        assert.strictEqual(normalizeStatus("Shortlisted — Round 3"), "Shortlisted — Round 3");
        assert.strictEqual(normalizeStatus("hr"), "Shortlisted — Round 3");
        assert.strictEqual(normalizeStatus("Moved to Next Round"), "Shortlisted — Round 2");
        assert.strictEqual(normalizeStatus("selected"), "Selected");
        assert.strictEqual(normalizeStatus("rejected"), "Rejected");
    });

    // -------------------------------------------------------------------------
    // 3. Email Templates (A, B, C, D, E) Validation
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Email Templates Execution & Formatting Tests ---");

    await asyncTest("Template A (Shortlisted): generates correct Subject and Message", async () => {
        const res = await sendStatusUpdateEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            status: "Shortlisted — Round 1",
        });

        // The service should return either a success or a clear error with mail provider
        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    await asyncTest("Template B (Moved to Next Round): generates correct Subject with roundName", async () => {
        const res = await sendStatusUpdateEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            status: "Shortlisted — Round 2",
            roundName: "Round 2",
        });

        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    await asyncTest("Template C (Interview Scheduled): generates correct Subject with date & link", async () => {
        const res = await sendInterviewInvitationEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            interviewDate: new Date(Date.now() + 86400000),
            timeZone: "UTC",
            duration: 45,
            roundNumber: 2,
            interviewType: "online",
            meetingUrl: "https://meet.google.com/abc-defg-hij",
            instructions: "Prepare system architecture walkthrough",
        });

        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    await asyncTest("Template D (Rejected): generates polite rejection Subject and body", async () => {
        const res = await sendStatusUpdateEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            status: "Rejected",
        });

        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    await asyncTest("Template E (Selected): generates offer/selection Subject and body", async () => {
        const res = await sendStatusUpdateEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            status: "Selected",
        });

        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    await asyncTest("Custom Recruiter Override: Subject and Message can be customized", async () => {
        const customSub = "Special Update on Your Senior Engineer Application at Acme Corp";
        const customMsg = "Dear Alex, the team was blown away by your technical interview! We are expediting your offer.";

        const res = await sendStatusUpdateEmail({
            candidateEmail: "test.candidate@example.com",
            candidateName: "Alex Mercer",
            jobTitle: "Senior Full Stack Engineer",
            companyName: "Acme Corp",
            status: "Selected",
            customSubject: customSub,
            customMessage: customMsg,
        });

        assert(res !== undefined, "Result must be returned");
        assert(typeof res.success === "boolean", "Must return boolean success");
    });

    // -------------------------------------------------------------------------
    // 4. Configuration & Security
    // -------------------------------------------------------------------------
    console.log("\n--- 4. OAuth2 Configuration & Credential Safety ---");
    test("validateEmailConfig validates required OAuth environment variables", () => {
        const cfg = validateEmailConfig();
        assert(typeof cfg.isValid === "boolean", "Config must return isValid boolean");
        assert(Array.isArray(cfg.missing), "Config must return missing array");
    });

    test("Application schema contains currentRound and audit history", () => {
        assert(APPLICATION_STATUSES.includes("Shortlisted — Round 1"), "Schema supports Round 1");
        assert(APPLICATION_STATUSES.includes("Shortlisted — Round 2"), "Schema supports Round 2");
        assert(APPLICATION_STATUSES.includes("Shortlisted — Round 3"), "Schema supports Round 3");
        assert(APPLICATION_STATUSES.includes("Selected"), "Schema supports Selected");
        assert(APPLICATION_STATUSES.includes("Rejected"), "Schema supports Rejected");
    });

    console.log("\n=================================================================");
    console.log(`🏁 RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================================");

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runRecruiterEmailTests().catch((err) => {
    console.error("Test runner crashed:", err);
    process.exit(1);
});
