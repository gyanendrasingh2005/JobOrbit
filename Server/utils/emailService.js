import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

/**
 * JobOrbit Email Notification Service
 * Uses Gmail OAuth2 for sending transactional emails.
 * Gracefully handles missing credentials, network errors, and retries.
 */

// Helper to sanitize environment variables
const sanitize = (val) => (val ? String(val).trim().replace(/^["']|["']$/g, "").trim() : "");

// Helper to mask email for safe logging
const maskEmail = (email) => {
    if (!email || typeof email !== "string") return "unknown";
    const [user, domain] = email.split("@");
    if (!domain) return "***";
    return `${user.slice(0, 2)}***@${domain}`;
};

/**
 * Validates that all required Gmail OAuth2 environment variables are present
 */
export const validateEmailConfig = () => {
    const hasAppPassword = Boolean(sanitize(process.env.EMAIL_USER) && sanitize(process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD));
    if (hasAppPassword) {
        return { isValid: true, missing: [], method: "app_password" };
    }

    const required = ["EMAIL_USER", "CLIENT_ID", "CLIENT_SECRET", "REFRESH_TOKEN"];
    const missing = required.filter((key) => !sanitize(process.env[key]));
    return {
        isValid: missing.length === 0,
        missing,
        method: "oauth2",
    };
};

let cachedTransporter = null;

/**
 * Create or return cached reusable Nodemailer transporter using Gmail App Password or OAuth2
 */
export const createTransporter = () => {
    if (cachedTransporter) return cachedTransporter;

    const user = sanitize(process.env.EMAIL_USER);
    const pass = sanitize(process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD);

    // 1. If App Password is provided, prefer direct high-speed Gmail SMTP
    if (user && pass) {
        try {
            cachedTransporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user, pass },
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 8000,
            });
            return cachedTransporter;
        } catch (err) {
            console.warn("Failed to create App Password transporter:", err.message);
        }
    }

    // 2. Otherwise use Gmail OAuth2
    const { isValid } = validateEmailConfig();
    if (!isValid) {
        return null;
    }

    const clientId = sanitize(process.env.CLIENT_ID);
    const clientSecret = sanitize(process.env.CLIENT_SECRET);
    const refreshToken = sanitize(process.env.REFRESH_TOKEN);

    try {
        cachedTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user,
                clientId,
                clientSecret,
                refreshToken,
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000,
        });
        return cachedTransporter;
    } catch (error) {
        console.error("Failed to initialize Gmail OAuth2 transporter:", error.message);
        return null;
    }
};

/**
 * Verify transporter connectivity & OAuth2 configuration
 */
export const verifyEmailTransporter = async () => {
    const { isValid, missing } = validateEmailConfig();
    if (!isValid) {
        return {
            success: false,
            error: `Missing required environment variables: ${missing.join(", ")}`,
        };
    }

    const transporter = createTransporter();
    if (!transporter) {
        return {
            success: false,
            error: "Failed to create Nodemailer Gmail OAuth2 transporter instance",
        };
    }

    try {
        await transporter.verify();
        return { success: true, message: "Gmail OAuth2 transporter verified successfully" };
    } catch (smtpError) {
        // Also check if Google OAuth2 token endpoint accepts the credentials
        try {
            const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: sanitize(process.env.CLIENT_ID),
                    client_secret: sanitize(process.env.CLIENT_SECRET),
                    refresh_token: sanitize(process.env.REFRESH_TOKEN),
                    grant_type: "refresh_token",
                }),
            });
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
                return {
                    success: false,
                    oauthValid: true,
                    scope: tokenData.scope,
                    error: `OAuth credentials valid with scope '${tokenData.scope}', but SMTP server requires 'https://mail.google.com/' scope or Gmail API enablement in Google Cloud Console.`,
                };
            } else {
                return {
                    success: false,
                    oauthValid: false,
                    error: `OAuth token exchange failed: ${tokenData.error_description || tokenData.error}`,
                };
            }
        } catch (fetchError) {
            return {
                success: false,
                error: `SMTP verification failed: ${smtpError.message}`,
            };
        }
    }
};

/**
 * Base email layout with JobOrbit branding
 */
const renderEmailLayout = ({ title, subtitle, contentHtml, actionUrl, actionText }) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const finalActionUrl = actionUrl || `${appUrl}/profile`;
    const finalActionText = actionText || "View in JobOrbit";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "JobOrbit Notification"}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6fa;
      padding: 32px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #6A38C2 0%, #4a249d 100%);
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .brand-logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      color: #ffffff;
    }
    .brand-logo span {
      color: #F83002;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    }
    .body {
      padding: 32px 28px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .lead {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-primary { background-color: #ede9fe; color: #6A38C2; }
    .badge-success { background-color: #dcfce7; color: #15803d; }
    .badge-warning { background-color: #fef3c7; color: #b45309; }
    .badge-danger { background-color: #fee2e2; color: #b91c1c; }
    .badge-info { background-color: #e0f2fe; color: #0369a1; }
    .button-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background-color: #6A38C2;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 13px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(106, 56, 194, 0.25);
    }
    .btn:hover {
      background-color: #5829a8;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 28px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer a {
      color: #6A38C2;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-logo">Job<span>Orbit</span></div>
        <p class="header-subtitle">${subtitle || "Elevating your career trajectory"}</p>
      </div>
      <div class="body">
        ${contentHtml}
        ${actionUrl ? `
        <div class="button-container">
          <a href="${finalActionUrl}" class="btn" target="_blank">${finalActionText}</a>
        </div>
        ` : ""}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} JobOrbit Inc. All rights reserved.</p>
        <p>This is an automated notification regarding your job application or interview schedule.</p>
        <p><a href="${appUrl}">Visit JobOrbit</a> • <a href="${appUrl}/profile">Manage Applications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
};

/**
 * Generic core email sender with safe error logging and dual OAuth2 transport
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    if (!to) {
        return { success: false, error: "Recipient email is required" };
    }

    if (process.env.MOCK_EMAIL === "true") {
        console.log(`[EmailService] (SIMULATED DEV DELIVERY) To: ${maskEmail(to)}, Subject: "${subject}"`);
        return { success: true, messageId: `mock_${Date.now()}`, provider: "simulated-dev" };
    }

    const { isValid, missing } = validateEmailConfig();
    if (!isValid) {
        console.warn(
            `[EmailService] Skipping email to ${maskEmail(to)} - Missing environment variables: ${missing.join(", ")}`
        );
        return {
            success: false,
            skipped: true,
            error: `Missing credentials: ${missing.join(", ")}`,
        };
    }

    const transporter = createTransporter();
    if (!transporter) {
        return {
            success: false,
            skipped: true,
            error: "Failed to initialize email transporter",
        };
    }

    const senderEmail = sanitize(process.env.EMAIL_USER);
    const mailOptions = {
        from: `"JobOrbit Careers" <${senderEmail}>`,
        to,
        subject,
        html,
        text: text || "Please open this email in an HTML-compatible client.",
    };

    // 1. Attempt sending via standard Nodemailer Gmail OAuth2 transporter with timeout guard
    try {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(new Error("SMTP connection timed out or closed during authentication (Gmail requires 'https://mail.google.com/' scope for SMTP XOAUTH2)"));
            }, 6000);
        });

        const sendPromise = new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err, info) => {
                clearTimeout(timer);
                if (err) return reject(err);
                resolve(info);
            });
        });

        const info = await Promise.race([sendPromise, timeoutPromise]);
        clearTimeout(timer);
        console.log(`[EmailService] Email successfully delivered to ${maskEmail(to)}, messageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, provider: "nodemailer-gmail-oauth2" };
    } catch (smtpError) {
        console.warn(`[EmailService] Nodemailer SMTP send attempt finished for ${maskEmail(to)}: ${smtpError.message}. Checking Gmail API...`);

        // 2. Fallback attempt via Gmail REST API messages.send (if user enabled Gmail API)
        try {
            const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: sanitize(process.env.CLIENT_ID),
                    client_secret: sanitize(process.env.CLIENT_SECRET),
                    refresh_token: sanitize(process.env.REFRESH_TOKEN),
                    grant_type: "refresh_token",
                }),
            });
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
                // Build MIME RFC 2822 email
                const boundary = "====boundary_" + Date.now() + "====";
                const rfc822 = [
                    `From: "JobOrbit Careers" <${senderEmail}>`,
                    `To: <${to}>`,
                    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
                    `MIME-Version: 1.0`,
                    `Content-Type: multipart/alternative; boundary="${boundary}"`,
                    ``,
                    `--${boundary}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `Content-Transfer-Encoding: 7bit`,
                    ``,
                    text || "Please view this email in an HTML-compatible email reader.",
                    ``,
                    `--${boundary}`,
                    `Content-Type: text/html; charset=utf-8`,
                    `Content-Transfer-Encoding: 7bit`,
                    ``,
                    html,
                    ``,
                    `--${boundary}--`,
                ].join("\r\n");

                const encodedRaw = Buffer.from(rfc822)
                    .toString("base64")
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_")
                    .replace(/=+$/, "");

                const restRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ raw: encodedRaw }),
                });

                const restData = await restRes.json();
                if (restRes.ok && restData.id) {
                    console.log(`[EmailService] Email successfully delivered via Gmail API to ${maskEmail(to)}, id: ${restData.id}`);
                    return { success: true, messageId: restData.id, provider: "gmail-api-oauth2" };
                } else if (restData.error) {
                    const apiErrMsg = restData.error.message || "Gmail API rejected request";
                    console.error(`[EmailService] Gmail API send failed for ${maskEmail(to)}:`, apiErrMsg);
                    let actionableError = apiErrMsg;
                    if (apiErrMsg.includes("has not been used") || apiErrMsg.includes("disabled")) {
                        actionableError = "Gmail API is not enabled in your Google Cloud Project. Please enable it at https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=988519451881 or configure EMAIL_PASS (Gmail App Password) in .env";
                    }
                    return {
                        success: false,
                        message: actionableError,
                        error: actionableError,
                    };
                }
            }
        } catch (restError) {
            console.error(`[EmailService] REST fallback error for ${maskEmail(to)}:`, restError.message);
        }

        return {
            success: false,
            error: smtpError.message,
        };
    }
};

/**
 * 1. Application Confirmation Email
 */
export const sendApplicationConfirmationEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    applicationId,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const title = `Application Received: ${jobTitle} at ${companyName}`;

    const contentHtml = `
      <h2 class="title">Application Submitted Successfully! 🎉</h2>
      <p class="lead">Hi ${candidateName || "Candidate"},</p>
      <p class="lead">
        Thank you for applying through JobOrbit! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received and is now with the hiring team.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Position</span>
          <span class="info-value">${jobTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company</span>
          <span class="info-value">${companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date Applied</span>
          <span class="info-value">${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Initial Status</span>
          <span class="info-value"><span class="badge badge-primary">Applied</span></span>
        </div>
      </div>

      <p class="lead" style="font-size: 14px; margin-bottom: 0;">
        You can track the progress of your application and any future interview schedules anytime directly from your JobOrbit dashboard.
      </p>
    `;

    return sendEmail({
        to: candidateEmail,
        subject: "JobOrbit — Application Confirmation",
        html: renderEmailLayout({
            title,
            subtitle: "Application Confirmation",
            contentHtml,
            actionUrl: `${appUrl}/profile`,
            actionText: "Track Your Application",
        }),
    });
};

/**
 * Helper to escape HTML characters in user-provided strings
 */
export const escapeHtml = (unsafe) => {
    if (!unsafe || typeof unsafe !== "string") return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * 2. Application Status Update Email (Templates A, B, D, E & Custom Override)
 */
export const sendStatusUpdateEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    status,
    notes,
    feedback,
    customSubject,
    customMessage,
    roundName,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const normalizedStatus = status ? status.toLowerCase() : "";

    const safeName = escapeHtml(candidateName || "Candidate");
    const safeJobTitle = escapeHtml(jobTitle || "the position");
    const safeCompany = escapeHtml(companyName || "the hiring team");
    const safeStatus = escapeHtml(status || "");
    const safeFeedback = escapeHtml(feedback || "");
    const safeNotes = escapeHtml(notes || "");

    let badgeClass = "badge-primary";
    let statusMessage = "";
    let subject = "";

    // Standard requested templates
    if (normalizedStatus.includes("round") && !normalizedStatus.includes("completed") && !normalizedStatus.includes("round 1")) {
        // Template B: Moved to Next Round
        const targetRound = roundName || status;
        badgeClass = "badge-warning";
        subject = `Congratulations! You Have Advanced to ${targetRound} — ${jobTitle}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, congratulations! You have successfully advanced to ${targetRound} for the ${jobTitle} position at ${companyName}. Please check your applicant dashboard for further details.`;
    } else if (normalizedStatus.includes("shortlist") || normalizedStatus.includes("round 1")) {
        // Template A: Shortlisted
        badgeClass = "badge-warning";
        subject = `Congratulations! You Have Been Shortlisted for ${jobTitle}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, congratulations! Your application for ${jobTitle} at ${companyName} has been shortlisted. We will share the next steps with you soon.`;
    } else if (normalizedStatus.includes("select") || normalizedStatus.includes("offer") || normalizedStatus.includes("hired")) {
        // Template E: Selected
        badgeClass = "badge-success";
        subject = `Congratulations! You Have Been Selected for ${jobTitle}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, congratulations! We are pleased to inform you that you have been selected for ${jobTitle} at ${companyName}. Please check your dashboard for the next steps.`;
    } else if (normalizedStatus.includes("reject")) {
        // Template D: Rejected
        badgeClass = "badge-danger";
        subject = `Update on Your Application for ${jobTitle}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, thank you for applying for ${jobTitle} at ${companyName}. After careful consideration, we will not be proceeding with your application at this time. We appreciate your interest and wish you the best in your job search.`;
    } else if (normalizedStatus.includes("round 1 completed") || normalizedStatus.includes("round 2 completed") || normalizedStatus.includes("round 3 completed")) {
        badgeClass = "badge-success";
        subject = `JobOrbit — ${status}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, you have completed ${status}! The recruiting team is assessing the results and will follow up with next steps.`;
    } else if (normalizedStatus.includes("accepted") || normalizedStatus.includes("accept")) {
        badgeClass = "badge-success";
        subject = `JobOrbit — Application Accepted for Consideration`;
        statusMessage = `Dear ${candidateName || "Candidate"}, great news! Your application for ${jobTitle} at ${companyName} has been accepted for consideration by the hiring team. We are reviewing your profile for upcoming interview rounds.`;
    } else {
        badgeClass = "badge-info";
        subject = `JobOrbit: Update on your application for ${jobTitle} at ${companyName}`;
        statusMessage = `Dear ${candidateName || "Candidate"}, your application for ${jobTitle} at ${companyName} has been updated to: ${status}.`;
    }

    // Support recruiter custom override
    const finalSubject = customSubject?.trim() || subject;
    const finalMessage = customMessage?.trim() || statusMessage;
    const safeFinalMessage = escapeHtml(finalMessage);

    const contentHtml = `
      <h2 class="title">Application Status Update</h2>
      <p class="lead" style="white-space: pre-line;">${safeFinalMessage}</p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Position</span>
          <span class="info-value">${safeJobTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company</span>
          <span class="info-value">${safeCompany}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Stage</span>
          <span class="info-value"><span class="badge ${badgeClass}">${safeStatus}</span></span>
        </div>
        ${safeFeedback ? `
        <div class="info-row">
          <span class="info-label">Recruiter Feedback</span>
          <span class="info-value" style="font-weight: 500; text-align: left; max-width: 60%; color: #4338ca;">${safeFeedback}</span>
        </div>
        ` : safeNotes ? `
        <div class="info-row">
          <span class="info-label">Notes</span>
          <span class="info-value" style="font-weight: 400; text-align: left; max-width: 60%;">${safeNotes}</span>
        </div>
        ` : ""}
      </div>
    `;

    const plainText = `${finalMessage}\n\nPosition: ${jobTitle}\nCompany: ${companyName}\nCurrent Stage: ${status}\n${feedback ? `Feedback: ${feedback}\n` : ""}\nView dashboard: ${appUrl}/dashboard`;

    return sendEmail({
        to: candidateEmail,
        subject: finalSubject,
        html: renderEmailLayout({
            title: `Application Status: ${status}`,
            subtitle: "Hiring Pipeline Update",
            contentHtml,
            actionUrl: `${appUrl}/dashboard`,
            actionText: "View Your Application Dashboard",
        }),
        text: plainText,
    });
};

/**
 * 3. Interview Invitation Email (Template C)
 */
export const sendInterviewInvitationEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    interviewDate,
    timeZone,
    duration,
    roundNumber = 1,
    interviewType,
    meetingUrl,
    location,
    instructions,
    customSubject,
    customMessage,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const formattedDate = new Date(interviewDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    const isOnline = interviewType?.toLowerCase() !== "in-person";
    const subject = customSubject?.trim() || `Interview Scheduled for ${jobTitle} at ${companyName}`;
    const defaultLead = `<strong>${escapeHtml(companyName)}</strong> has invited you to an interview for <strong>Round ${roundNumber}</strong> for the <strong>${escapeHtml(jobTitle)}</strong> position.`;
    const messageBody = customMessage?.trim() ? `<p class="lead" style="white-space: pre-line;">${escapeHtml(customMessage)}</p>` : `<p class="lead">${defaultLead}</p>`;

    const contentHtml = `
      <h2 class="title">You're Invited to Interview — Round ${roundNumber}! 🗓️</h2>
      <p class="lead">Hi ${escapeHtml(candidateName || "Candidate")},</p>
      ${messageBody}

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Hiring Stage</span>
          <span class="info-value"><span class="badge badge-primary">Round ${roundNumber}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Date & Time</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Timezone</span>
          <span class="info-value">${escapeHtml(timeZone || "UTC")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration</span>
          <span class="info-value">${duration || 45} minutes</span>
        </div>
        <div class="info-row">
          <span class="info-label">Format</span>
          <span class="info-value">${isOnline ? "Online Video Meeting" : "In-Person"}</span>
        </div>
        ${isOnline && meetingUrl ? `
        <div class="info-row">
          <span class="info-label">Meeting Link</span>
          <span class="info-value"><a href="${escapeHtml(meetingUrl)}" style="color: #6A38C2; word-break: break-all;" target="_blank">Join Link</a></span>
        </div>
        ` : ""}
        ${!isOnline && location ? `
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${escapeHtml(location)}</span>
        </div>
        ` : ""}
        ${instructions ? `
        <div class="info-row">
          <span class="info-label">Instructions</span>
          <span class="info-value" style="font-weight: 400; text-align: left; max-width: 60%;">${escapeHtml(instructions)}</span>
        </div>
        ` : ""}
      </div>

      <p class="lead" style="font-size: 14px;">
        Please make sure to test your audio, camera, and internet connection ahead of time. You can view all interview details directly on your dashboard.
      </p>
    `;

    const plainText = `Interview Scheduled for ${jobTitle} at ${companyName}\n\nHi ${candidateName},\nDate: ${formattedDate}\nDuration: ${duration || 45} mins\nFormat: ${isOnline ? 'Online Video Meeting' : 'In-Person'}\n${isOnline && meetingUrl ? `Meeting Link: ${meetingUrl}\n` : ''}${location ? `Location: ${location}\n` : ''}${instructions ? `Instructions: ${instructions}\n` : ''}\nView details: ${appUrl}/dashboard`;

    return sendEmail({
        to: candidateEmail,
        subject,
        html: renderEmailLayout({
            title: `Interview Scheduled: ${jobTitle}`,
            subtitle: "Interview Scheduled",
            contentHtml,
            actionUrl: isOnline && meetingUrl ? meetingUrl : `${appUrl}/dashboard`,
            actionText: isOnline && meetingUrl ? "Join Meeting Link" : "View Interview Details",
        }),
        text: plainText,
    });
};

/**
 * 4. Interview Rescheduled Email
 */
export const sendInterviewRescheduledEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    newDate,
    timeZone,
    duration,
    meetingUrl,
    location,
    instructions,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const formattedDate = new Date(newDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    const contentHtml = `
      <h2 class="title">Interview Rescheduled 📅</h2>
      <p class="lead">Hi ${candidateName || "Candidate"},</p>
      <p class="lead">
        Please note that your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been rescheduled to a new time.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">New Date & Time</span>
          <span class="info-value" style="color: #6A38C2;">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Timezone</span>
          <span class="info-value">${timeZone || "UTC"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration</span>
          <span class="info-value">${duration || 45} minutes</span>
        </div>
        ${meetingUrl ? `
        <div class="info-row">
          <span class="info-label">Meeting URL</span>
          <span class="info-value"><a href="${meetingUrl}" style="color: #6A38C2;" target="_blank">Join Link</a></span>
        </div>
        ` : ""}
        ${location ? `
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${location}</span>
        </div>
        ` : ""}
        ${instructions ? `
        <div class="info-row">
          <span class="info-label">Notes</span>
          <span class="info-value" style="font-weight: 400; text-align: left; max-width: 60%;">${instructions}</span>
        </div>
        ` : ""}
      </div>
    `;

    return sendEmail({
        to: candidateEmail,
        subject: `Interview Rescheduled: ${jobTitle} at ${companyName}`,
        html: renderEmailLayout({
            title: `Interview Rescheduled: ${jobTitle}`,
            subtitle: "Schedule Updated",
            contentHtml,
            actionUrl: meetingUrl || `${appUrl}/profile`,
            actionText: meetingUrl ? "Join Meeting" : "View Dashboard",
        }),
    });
};

/**
 * 5. Interview Cancellation Email
 */
export const sendInterviewCancelledEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    reason,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

    const contentHtml = `
      <h2 class="title">Interview Cancelled</h2>
      <p class="lead">Hi ${candidateName || "Candidate"},</p>
      <p class="lead">
        We would like to inform you that your upcoming interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been cancelled.
      </p>

      ${reason ? `
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Reason / Notes</span>
          <span class="info-value" style="font-weight: 400; text-align: left; max-width: 60%;">${reason}</span>
        </div>
      </div>
      ` : ""}

      <p class="lead" style="font-size: 14px;">
        If you have any questions or require additional details, please check your application status on JobOrbit.
      </p>
    `;

    return sendEmail({
        to: candidateEmail,
        subject: `Interview Cancelled: ${jobTitle} at ${companyName}`,
        html: renderEmailLayout({
            title: `Interview Cancelled: ${jobTitle}`,
            subtitle: "Cancellation Notice",
            contentHtml,
            actionUrl: `${appUrl}/profile`,
            actionText: "View Dashboard",
        }),
    });
};

/**
 * 6. Interview Reminder Email (24h or 1h)
 */
export const sendInterviewReminderEmail = async ({
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    interviewDate,
    timeZone,
    duration,
    reminderType, // '24h' or '1h'
    meetingUrl,
    location,
}) => {
    const appUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const formattedDate = new Date(interviewDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    const isUrgent = reminderType === "1h";
    const timeframeText = isUrgent ? "starting in 1 hour" : "coming up in 24 hours";

    const contentHtml = `
      <h2 class="title">Interview Reminder ⏰</h2>
      <p class="lead">Hi ${candidateName || "Candidate"},</p>
      <p class="lead">
        This is a friendly reminder that your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is ${timeframeText}.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Date & Time</span>
          <span class="info-value" style="color: #6A38C2;">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Timezone</span>
          <span class="info-value">${timeZone || "UTC"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration</span>
          <span class="info-value">${duration || 45} minutes</span>
        </div>
        ${meetingUrl ? `
        <div class="info-row">
          <span class="info-label">Meeting URL</span>
          <span class="info-value"><a href="${meetingUrl}" style="color: #6A38C2;" target="_blank">Join Video Room</a></span>
        </div>
        ` : ""}
        ${location ? `
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${location}</span>
        </div>
        ` : ""}
      </div>
    `;

    return sendEmail({
        to: candidateEmail,
        subject: `Reminder: Interview for ${jobTitle} ${timeframeText}`,
        html: renderEmailLayout({
            title: `Interview Reminder: ${jobTitle}`,
            subtitle: isUrgent ? "Starting Soon" : "Upcoming Interview",
            contentHtml,
            actionUrl: meetingUrl || `${appUrl}/profile`,
            actionText: meetingUrl ? "Join Video Call" : "View Details",
        }),
    });
};
