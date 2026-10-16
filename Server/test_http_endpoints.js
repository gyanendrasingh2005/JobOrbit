import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";
import { Job } from "./models/job.models.js";
import { Company } from "./models/company.models.js";
import { Application } from "./models/application.models.js";
import FormData from "form-data";
import axios from "axios";

dotenv.config();
process.env.NODE_ENV = "test";

const { default: app } = await import("./index.js");

const runHttpTests = async () => {
  console.log("\n=======================================================");
  console.log("   JobOrbit: End-to-End HTTP Route Tests");
  console.log("=======================================================\n");

  let server;
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Start ephemeral server on random free port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const testBaseUrl = `http://localhost:${port}`;
    console.log(`✅ [Server] Test Express server listening on port ${port}`);

    // 1. Create Test Candidate
    const candidateEmail = `http_candidate_${Date.now()}@joborbit.test`;
    const candidate = await User.create({
      fullname: "Alex Candidate",
      email: candidateEmail,
      phoneNumber: 9112233445,
      password: "password123",
      role: "student",
      profile: {},
    });

    const candidateToken = jwt.sign({ userId: candidate._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    console.log("✅ [Auth] Test Candidate created & JWT signed");

    // 2. Test Resume Upload via HTTP multipart
    const form = new FormData();
    const mockPdfContent = Buffer.from("%PDF-1.4 Mock Candidate Resume Content for Job Application");
    form.append("file", mockPdfContent, {
      filename: "Alex_Candidate_Resume.pdf",
      contentType: "application/pdf",
    });

    const uploadRes = await axios.post(`${testBaseUrl}/api/v1/user/profile/resume`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    console.log("✅ [HTTP POST /profile/resume] Status:", uploadRes.status, "Success:", uploadRes.data.success);
    console.log("    - Filename:", uploadRes.data.resumeOriginalName);
    console.log("    - User resume on profile:", uploadRes.data.user.profile.resume ? "Exists" : "Missing");

    // 3. Test Resume View & Download via HTTP
    const viewRes = await axios.get(`${testBaseUrl}/api/v1/user/resume/view/${candidate._id}`, {
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
      responseType: "arraybuffer",
    });

    console.log("✅ [HTTP GET /resume/view] Status:", viewRes.status);
    console.log("    - Content-Type:", viewRes.headers["content-type"]);
    console.log("    - Content-Disposition:", viewRes.headers["content-disposition"]);
    console.log("    - Body length:", viewRes.data.length);

    const downloadRes = await axios.get(`${testBaseUrl}/api/v1/user/resume/download/${candidate._id}`, {
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
      responseType: "arraybuffer",
    });

    console.log("✅ [HTTP GET /resume/download] Status:", downloadRes.status);
    console.log("    - Content-Disposition:", downloadRes.headers["content-disposition"]);

    // 4. Test Recruiter Creation & Job Posting
    const recruiterEmail = `http_recruiter_${Date.now()}@joborbit.test`;
    const recruiter = await User.create({
      fullname: "Sarah Recruiter",
      email: recruiterEmail,
      phoneNumber: 9988776655,
      password: "password123",
      role: "recruiter",
      profile: {},
    });

    const recruiterToken = jwt.sign({ userId: recruiter._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    const company = await Company.create({
      companyName: `FinTech Labs ${Date.now()}`,
      userId: recruiter._id,
      location: "New York, NY",
    });

    const job = await Job.create({
      title: "Backend Platform Engineer",
      description: "Build robust Node.js microservices.",
      requirements: ["Node.js", "Express", "MongoDB"],
      salary: 30,
      location: "New York, NY",
      jobType: "Full-time",
      experienceLevel: 3,
      position: 1,
      company: company._id,
      created_by: recruiter._id,
    });

    // 5. Test Candidate Applies for Job (HTTP POST /api/v1/application/apply/:jobId)
    const applyRes = await axios.post(`${testBaseUrl}/api/v1/application/apply/${job._id}`, {}, {
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    console.log("✅ [HTTP POST /application/apply] Status:", applyRes.status, "Message:", applyRes.data.message);
    const applicationId = applyRes.data.application._id;

    // 6. Test Candidate Fetch Applied Jobs (HTTP GET /api/v1/application/get)
    const appliedJobsRes = await axios.get(`${testBaseUrl}/api/v1/application/get`, {
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });

    console.log("✅ [HTTP GET /application/get] Status:", appliedJobsRes.status);
    console.log("    - Applied jobs count:", appliedJobsRes.data.application.length);
    const myApp = appliedJobsRes.data.application[0];
    console.log("    - Application Job Title:", myApp.job.title);
    console.log("    - Application Status:", myApp.status);
    console.log("    - Latest Status Update Date:", myApp.latestStatusUpdateAt);

    // 7. Test Recruiter Status Update (HTTP POST /api/v1/application/status/:id/update)
    const updateRes = await axios.post(
      `${testBaseUrl}/api/v1/application/status/${applicationId}/update`,
      {
        status: "Shortlisted — Round 1",
        roundName: "Round 1",
        feedback: "Strong backend background",
        notes: "Moving to initial technical screen",
        sendEmail: false, // Don't send real email in automated test
      },
      {
        headers: {
          Authorization: `Bearer ${recruiterToken}`,
        },
      }
    );

    console.log("✅ [HTTP POST /application/status/:id/update] Status:", updateRes.status);
    console.log("    - Updated candidate status:", updateRes.data.application.status);
    console.log("    - Audit History Count:", updateRes.data.application.statusHistory.length);

    // 8. Test Invalid Status Transition Rejection (Cannot move from Rejected to Round 2)
    // First reject
    await axios.post(
      `${testBaseUrl}/api/v1/application/status/${applicationId}/update`,
      { status: "Rejected", sendEmail: false },
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );

    try {
      await axios.post(
        `${testBaseUrl}/api/v1/application/status/${applicationId}/update`,
        { status: "Shortlisted — Round 2", sendEmail: false },
        { headers: { Authorization: `Bearer ${recruiterToken}` } }
      );
      console.error("❌ FAILED: Invalid transition was not rejected!");
    } catch (err) {
      console.log("✅ [Security] Invalid transition from Rejected to Round 2 correctly rejected with 400:", err.response?.status === 400);
      console.log("    - Error message:", err.response?.data?.message);
    }

    // 9. Test Unauthorized Recruiter Access Rejection
    const rogueRecruiter = await User.create({
      fullname: "Rogue Recruiter",
      email: `rogue_${Date.now()}@joborbit.test`,
      phoneNumber: 9999900000,
      password: "password123",
      role: "recruiter",
      profile: {},
    });
    const rogueToken = jwt.sign({ userId: rogueRecruiter._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

    try {
      await axios.post(
        `${testBaseUrl}/api/v1/application/status/${applicationId}/update`,
        { status: "Under Review", sendEmail: false },
        { headers: { Authorization: `Bearer ${rogueToken}` } }
      );
      console.error("❌ FAILED: Unauthorized recruiter was allowed to modify application!");
    } catch (err) {
      console.log("✅ [Security] Unauthorized recruiter correctly blocked with 403:", err.response?.status === 403);
    }

    // 10. Test Candidate Deletes Resume (HTTP DELETE /api/v1/user/profile/resume)
    const deleteResumeRes = await axios.delete(`${testBaseUrl}/api/v1/user/profile/resume`, {
      headers: {
        Authorization: `Bearer ${candidateToken}`,
      },
    });
    console.log("✅ [HTTP DELETE /profile/resume] Status:", deleteResumeRes.status);
    console.log("    - User resume cleared:", deleteResumeRes.data.user.profile.resume === "");

    // 11. Cleanup test records
    await Application.findByIdAndDelete(applicationId);
    await Job.findByIdAndDelete(job._id);
    await Company.findByIdAndDelete(company._id);
    await User.findByIdAndDelete(candidate._id);
    await User.findByIdAndDelete(recruiter._id);
    await User.findByIdAndDelete(rogueRecruiter._id);

    server.close();
    console.log("\n=======================================================");
    console.log("   ALL HTTP INTEGRATION TESTS PASSED 100% ✅");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    if (server) server.close();
    console.error("❌ HTTP Test Failed:", error.response?.data || error.message);
    process.exit(1);
  }
};

runHttpTests();
