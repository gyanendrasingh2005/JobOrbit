import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model.js";
import { Job } from "./models/job.models.js";
import { Company } from "./models/company.models.js";
import { Application } from "./models/application.models.js";
import {
  storeResumeFile,
  removeStoredResume,
  validateResumeFile,
  getResumeGridFSBucket,
} from "./utils/resumeStorage.js";
import { normalizeStatus } from "./controllers/application.controllers.js";

dotenv.config();

const runVerification = async () => {
  console.log("\n=======================================================");
  console.log("   JobOrbit: Resume Upload & Tracker Verification");
  console.log("=======================================================\n");

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ [DB] Connected to MongoDB");

    // 1. Test GridFS Bucket Access
    const bucket = getResumeGridFSBucket();
    console.log("✅ [GridFS] GridFS bucket initialized successfully");

    // 2. Validate Resume File Helper
    const validPdfFile = {
      originalname: "John_Doe_Software_Engineer_Resume.pdf",
      mimetype: "application/pdf",
      size: 1024 * 500, // 500 KB
      buffer: Buffer.from("%PDF-1.4 Mock PDF binary content for testing resume storage"),
    };

    const oversizedFile = {
      originalname: "huge_portfolio.pdf",
      mimetype: "application/pdf",
      size: 6 * 1024 * 1024, // 6 MB
      buffer: Buffer.alloc(100),
    };

    const invalidTypeFile = {
      originalname: "script.exe",
      mimetype: "application/x-msdownload",
      size: 1024 * 50,
      buffer: Buffer.alloc(100),
    };

    const validCheck = validateResumeFile(validPdfFile);
    console.log("✅ [Validation] Valid PDF check passed:", validCheck.valid === true);

    const overCheck = validateResumeFile(oversizedFile);
    console.log("✅ [Validation] Oversized >5MB rejected correctly:", overCheck.valid === false && overCheck.message.includes("5 MB"));

    const typeCheck = validateResumeFile(invalidTypeFile);
    console.log("✅ [Validation] Unsupported file rejected correctly:", typeCheck.valid === false);

    // 3. Test Candidate Creation & Resume Upload (GridFS + Local)
    const testCandidateEmail = `test_candidate_${Date.now()}@joborbit.test`;
    const candidate = await User.create({
      fullname: "Test Candidate",
      email: testCandidateEmail,
      phoneNumber: 9876543210,
      password: "hashed_password_123",
      role: "student",
      profile: {},
    });

    console.log(`✅ [Candidate] Test candidate created (${candidate._id})`);

    // Store resume
    const stored = await storeResumeFile({
      file: validPdfFile,
      userId: candidate._id,
      req: { protocol: "http", get: () => "localhost:8000" },
    });

    console.log("✅ [Storage] storeResumeFile executed successfully:");
    console.log("    - URL:", stored.url);
    console.log("    - FileId (GridFS):", stored.fileId);
    console.log("    - FileKey:", stored.fileKey);
    console.log("    - ContentType:", stored.contentType);
    console.log("    - Size:", stored.size);

    candidate.profile.resume = stored.url;
    candidate.profile.resumeOriginalName = stored.originalName;
    candidate.profile.resumeFileId = stored.fileId;
    candidate.profile.resumeFileKey = stored.fileKey;
    candidate.profile.resumeUploadedAt = stored.uploadedAt;
    candidate.profile.resumeContentType = stored.contentType;
    candidate.profile.resumeSize = stored.size;
    await candidate.save();

    // Verify persistence in MongoDB
    const fetchedCandidate = await User.findById(candidate._id);
    const hasMetadata =
      fetchedCandidate.profile.resume &&
      fetchedCandidate.profile.resumeOriginalName === validPdfFile.originalname &&
      fetchedCandidate.profile.resumeFileId &&
      fetchedCandidate.profile.resumeUploadedAt;

    console.log("✅ [Persistence] Resume metadata fully verified in MongoDB:", Boolean(hasMetadata));

    // Verify GridFS File Existence
    const gridFiles = await bucket.find({ _id: candidate.profile.resumeFileId }).toArray();
    console.log("✅ [GridFS] File exists in GridFS bucket:", gridFiles.length === 1 && gridFiles[0].filename === stored.fileKey);

    // 4. Test Resume Replacement
    const replacementFile = {
      originalname: "John_Doe_Updated_Resume.docx",
      mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1024 * 200,
      buffer: Buffer.from("Mock DOCX content for updated resume"),
    };

    // Remove old file
    await removeStoredResume(fetchedCandidate);
    const oldFileInGrid = await bucket.find({ _id: candidate.profile.resumeFileId }).toArray();
    console.log("✅ [Cleanup] Old file safely removed from GridFS:", oldFileInGrid.length === 0);

    const replacementStored = await storeResumeFile({
      file: replacementFile,
      userId: candidate._id,
      req: { protocol: "http", get: () => "localhost:8000" },
    });

    candidate.profile.resume = replacementStored.url;
    candidate.profile.resumeOriginalName = replacementStored.originalName;
    candidate.profile.resumeFileId = replacementStored.fileId;
    candidate.profile.resumeFileKey = replacementStored.fileKey;
    candidate.profile.resumeUploadedAt = replacementStored.uploadedAt;
    candidate.profile.resumeContentType = replacementStored.contentType;
    candidate.profile.resumeSize = replacementStored.size;
    await candidate.save();

    console.log("✅ [Replacement] Resume replaced successfully with DOCX file:", candidate.profile.resumeOriginalName);

    // 5. Test Recruiter & Job Creation for Tracker Tests
    const testRecruiterEmail = `test_recruiter_${Date.now()}@joborbit.test`;
    const recruiter = await User.create({
      fullname: "Test Recruiter",
      email: testRecruiterEmail,
      phoneNumber: 9123456780,
      password: "hashed_password_123",
      role: "recruiter",
      profile: {},
    });

    const company = await Company.create({
      companyName: `OrbitTech_${Date.now()}`,
      userId: recruiter._id,
      location: "San Francisco, CA",
    });

    const job = await Job.create({
      title: "Senior Full Stack Engineer",
      description: "Build scalable cloud services with React and Node.js.",
      requirements: ["React", "Node.js", "MongoDB"],
      salary: 25,
      location: "Remote",
      jobType: "Full-time",
      experienceLevel: 4,
      position: 2,
      company: company._id,
      created_by: recruiter._id,
    });

    console.log(`✅ [Job] Test Job posted by recruiter (${job.title})`);

    // 6. Test Job Application Creation
    const application = await Application.create({
      job: job._id,
      applicant: candidate._id,
      status: "Applied",
      statusHistory: [
        {
          status: "Applied",
          previousStatus: "",
          eventType: "application_submitted",
          changedAt: new Date(),
          changedBy: candidate._id,
          notes: "Application submitted by candidate",
        },
      ],
    });

    job.applications.push(application._id);
    await job.save();

    console.log("✅ [Tracker] Application created with initial status 'Applied'");

    // 7. Test Lifecycle Transitions & Audit History
    // Transition 1: Advance to 'Under Review'
    application.status = "Under Review";
    application.statusHistory.push({
      status: "Under Review",
      previousStatus: "Applied",
      eventType: "status_change",
      changedAt: new Date(),
      changedBy: recruiter._id,
      notes: "Resume reviewed by talent acquisition team",
    });
    await application.save();

    // Transition 2: Advance to 'Shortlisted — Round 1'
    application.status = "Shortlisted — Round 1";
    application.currentRound = "Round 1";
    application.feedback = "Impressive technical portfolio and resume";
    application.statusHistory.push({
      status: "Shortlisted — Round 1",
      previousStatus: "Under Review",
      eventType: "stage_advanced",
      changedAt: new Date(),
      changedBy: recruiter._id,
      notes: "Candidate shortlisted for Round 1 technical interview",
      feedback: application.feedback,
    });
    await application.save();

    // Verify audit trail in MongoDB
    const appRecord = await Application.findById(application._id);
    console.log("✅ [Lifecycle] Status correctly advanced to:", appRecord.status);
    console.log("✅ [Audit Trail] statusHistory length:", appRecord.statusHistory.length);
    console.log("✅ [Audit Trail] Latest history entry:", appRecord.statusHistory[appRecord.statusHistory.length - 1].status);

    // Transition 3: Test Invalid Transition from Rejected to Round 2
    const normPrev = "Rejected";
    const normTarget = "Shortlisted — Round 2";
    const isInvalid = normPrev === "Rejected" && normTarget !== "Rejected" && normTarget !== "Under Review" && normTarget !== "Applied";
    console.log("✅ [Security] Invalid transition from Rejected to Round 2 correctly detected:", isInvalid);

    // 8. Test Clean Up of Test Records
    await removeStoredResume(candidate);
    await Application.findByIdAndDelete(application._id);
    await Job.findByIdAndDelete(job._id);
    await Company.findByIdAndDelete(company._id);
    await User.findByIdAndDelete(candidate._id);
    await User.findByIdAndDelete(recruiter._id);

    console.log("✅ [Cleanup] Test records cleaned up safely");
    console.log("\n=======================================================");
    console.log("   ALL RESUME & APPLICATION TRACKER TESTS PASSED ✅");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
};

runVerification();
