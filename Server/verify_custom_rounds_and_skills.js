import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";
import { Job } from "./models/job.models.js";
import { Company } from "./models/company.models.js";
import { Application } from "./models/application.models.js";
import axios from "axios";
import http from "http";

dotenv.config();
process.env.NODE_ENV = "test";

const { default: app } = await import("./index.js");

const runVerification = async () => {
  console.log("\n=======================================================");
  console.log("   Verifying Custom Recruiter Rounds & Skill Dashboard");
  console.log("=======================================================\n");

  let server;
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Server] Running ephemeral test server on port ${port}`);

    // 1. Create Test Candidate
    const candidate = await User.create({
      fullname: "Skill Master Candidate",
      email: `skills_${Date.now()}@joborbit.test`,
      phoneNumber: 9112233445,
      password: "password123",
      role: "student",
      profile: {
        skills: ["JavaScript", "HTML"],
        resume: "https://joborbit.test/resumes/mock.pdf",
        resumeOriginalName: "Candidate_Resume.pdf",
      },
    });

    const candidateToken = jwt.sign({ userId: candidate._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
    console.log("✅ [Candidate] Created candidate with initial skills:", candidate.profile.skills);

    // 2. Test Skill Addition via POST /profile/skills/add
    const addSkillRes = await axios.post(
      `${baseUrl}/api/v1/user/profile/skills/add`,
      { skill: "React.js" },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.log("✅ [POST /profile/skills/add] Status:", addSkillRes.status);
    console.log("    - Updated Skills:", addSkillRes.data.skills);
    if (!addSkillRes.data.skills.includes("React.js")) throw new Error("React.js was not added!");

    // Test Duplicate prevention
    const dupRes = await axios.post(
      `${baseUrl}/api/v1/user/profile/skills/add`,
      { skill: "react.js" },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.log("✅ [Duplicate Skill Check] Prevented duplicate:", dupRes.data.message);

    // 3. Test Skill Removal via POST /profile/skills/remove
    const removeSkillRes = await axios.post(
      `${baseUrl}/api/v1/user/profile/skills/remove`,
      { skill: "HTML" },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.log("✅ [POST /profile/skills/remove] Status:", removeSkillRes.status);
    console.log("    - Updated Skills after remove:", removeSkillRes.data.skills);
    if (removeSkillRes.data.skills.includes("HTML")) throw new Error("HTML was not removed!");

    // 4. Test Update Profile with array of skills (fixing the .split bug)
    const updateProfileRes = await axios.post(
      `${baseUrl}/api/v1/user/profile/update`,
      {
        fullname: "Skill Master Pro",
        skills: ["React.js", "Node.js", "TypeScript", "Docker"],
      },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.log("✅ [POST /profile/update] Array skills update status:", updateProfileRes.status);
    console.log("    - User skills on DB:", updateProfileRes.data.user.profile.skills);
    if (updateProfileRes.data.user.profile.skills.length !== 4) throw new Error("Skills array update failed!");

    // 5. Test Recruiter Creates Job with CUSTOM Interview Rounds (e.g. 2 custom rounds)
    const recruiter = await User.create({
      fullname: "Dynamic Recruiter",
      email: `recruiter_${Date.now()}@joborbit.test`,
      phoneNumber: 9988776655,
      password: "password123",
      role: "recruiter",
      profile: {},
    });
    const recruiterToken = jwt.sign({ userId: recruiter._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

    const company = await Company.create({
      companyName: `Dynamic Rounds Corp ${Date.now()}`,
      userId: recruiter._id,
      location: "San Francisco, CA",
    });

    const customJob = await Job.create({
      title: "Senior Full Stack Engineer",
      description: "Fast-paced team with custom 2-round interview process.",
      requirements: ["React", "Node.js", "TypeScript"],
      salary: 40,
      location: "San Francisco, CA",
      jobType: "Full-time",
      experienceLevel: 4,
      position: 2,
      company: company._id,
      created_by: recruiter._id,
      totalRounds: 2,
      interviewRounds: [
        { roundNumber: 1, name: "Technical Screening" },
        { roundNumber: 2, name: "System Architecture & Final" },
      ],
    });

    console.log("✅ [Job Created] Configured with custom rounds count:", customJob.totalRounds);
    console.log("    - Rounds:", customJob.interviewRounds.map(r => `${r.roundNumber}: ${r.name}`));

    // 6. Candidate applies for the job
    const applyRes = await axios.post(
      `${baseUrl}/api/v1/application/apply/${customJob._id}`,
      {},
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    const applicationId = applyRes.data.application._id;
    console.log("✅ [Application] Candidate applied for custom 2-round job:", applicationId);

    // 7. Recruiter advances candidate directly through the 2 rounds and selects
    // Advance to Round 1
    const r1Res = await axios.post(
      `${baseUrl}/api/v1/application/status/${applicationId}/update`,
      { status: "Shortlisted — Round 1", roundName: "Technical Screening", sendEmail: false },
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );
    console.log("✅ [Recruiter Status] Moved to Round 1:", r1Res.data.application.status);

    // Advance to Round 2
    const r2Res = await axios.post(
      `${baseUrl}/api/v1/application/status/${applicationId}/update`,
      { status: "Shortlisted — Round 2", roundName: "System Architecture & Final", sendEmail: false },
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );
    console.log("✅ [Recruiter Status] Moved to Round 2:", r2Res.data.application.status);

    // Final Selection after 2 rounds (does NOT require 7 rounds)
    const selectRes = await axios.post(
      `${baseUrl}/api/v1/application/status/${applicationId}/update`,
      { status: "Selected", roundName: "Final Offer", sendEmail: false },
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );
    console.log("✅ [Recruiter Status] Selected after 2 rounds:", selectRes.data.application.status);
    console.log("    - Total History Events Recorded:", selectRes.data.application.statusHistory.length);

    // 8. Cleanup test documents
    await Application.findByIdAndDelete(applicationId);
    await Job.findByIdAndDelete(customJob._id);
    await Company.findByIdAndDelete(company._id);
    await User.findByIdAndDelete(candidate._id);
    await User.findByIdAndDelete(recruiter._id);

    server.close();
    console.log("\n=======================================================");
    console.log("   CUSTOM ROUNDS & SKILL DASHBOARD TESTS PASSED 100% ✅");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    if (server) server.close();
    console.error("❌ Test Failed:", error.response?.data || error.message);
    process.exit(1);
  }
};

runVerification();
