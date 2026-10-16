import { validateEmailConfig, verifyEmailTransporter, sendEmail } from "./utils/emailService.js";

async function runTest() {
    console.log("=== JobOrbit Gmail OAuth2 Diagnostic Test ===");

    // 1. Validate Environment Variables
    const validation = validateEmailConfig();
    console.log("\n1. Environment Variables Validation:");
    if (validation.isValid) {
        console.log("   ✅ All required environment variables are present (EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)");
    } else {
        console.log("   ❌ Missing environment variables:", validation.missing);
        process.exit(1);
    }

    // 2. Transporter Verification
    console.log("\n2. Transporter & OAuth2 Verification:");
    const verifyResult = await verifyEmailTransporter();
    if (verifyResult.success) {
        console.log("   ✅ Transporter successfully verified with Gmail!");
    } else {
        console.log("   ⚠️ Transporter verification response:", verifyResult.error);
        if (verifyResult.oauthValid) {
            console.log("   ℹ️ OAuth2 token exchange with Google was SUCCESSFUL (scope: " + verifyResult.scope + ")");
        }
    }

    // 3. Test Email Send Attempt (to EMAIL_USER safely)
    console.log("\n3. Testing Transactional Email Dispatch:");
    const testRecipient = process.env.EMAIL_USER;
    const sendResult = await sendEmail({
        to: testRecipient,
        subject: "JobOrbit Test Transactional Email",
        html: "<p>This is a test notification from JobOrbit.</p>",
        text: "This is a test notification from JobOrbit."
    });

    if (sendResult.success) {
        console.log("   ✅ Email successfully sent! Message ID:", sendResult.messageId, "(Provider:", sendResult.provider + ")");
    } else {
        console.log("   ⚠️ Send test result: success=false, error:", sendResult.error);
        console.log("   (Application & database states remain completely intact and unaffected by email status)");
    }

    console.log("\n=== Diagnostic Complete ===");
}

try {
    await runTest();
} catch (e) {
    console.error("Diagnostic error:", e);
}
