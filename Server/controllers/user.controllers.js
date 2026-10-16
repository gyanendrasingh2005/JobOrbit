import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.models.js";
import { Application } from "../models/application.models.js";
import { Company } from "../models/company.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import {
  storeResumeFile,
  removeStoredResume,
  streamResume,
  getBaseUrl,
} from "../utils/resumeStorage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const photosDir = path.join(__dirname, "..", "uploads", "photos");

// Helper: upload to Cloudinary with a 4-second timeout to avoid request blocking
const uploadToCloudinary = (content, options = {}) => {
  const uploadPromise = cloudinary.uploader.upload(content, options);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Cloudinary upload timed out.")),
      4000
    )
  );
  return Promise.race([uploadPromise, timeoutPromise]);
};

// Resilient photo storage helper: attempts Cloudinary, falls back cleanly to local disk
const storePhotoResilient = async ({ file, userId, req }) => {
  try {
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
  } catch (_) {}

  if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const fileUri = getDataUri(file);
      const cloudRes = await uploadToCloudinary(fileUri.content, {
        resource_type: "image",
        folder: "profile_photos",
      });
      if (cloudRes && cloudRes.secure_url) {
        return cloudRes.secure_url;
      }
    } catch (err) {
      console.warn("[user.controllers] Cloudinary photo upload failed, using local storage:", err.message);
    }
  }

  const ext = path.extname(file.originalname).toLowerCase() || ".png";
  const filename = `photo_${userId}_${Date.now()}${ext}`;
  const localPath = path.join(photosDir, filename);
  fs.writeFileSync(localPath, file.buffer);
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/uploads/photos/${filename}`;
};

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Someting is missing",
        success: false,
      });
    }
    const file = req.file;
    let url = "";
    if (file) {
      url = await storePhotoResilient({ file, userId: "reg_" + Date.now(), req });
    }

    const existedUser = await User.findOne({ email: email });
    if (existedUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: url,
      },
    });

    return res.status(201).json({
      message: "Account created",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error during registration",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email or password is missing",
        success: false,
      });
    }

    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // check role is correct or not and also verify password
    if (!isPasswordMatch || role != user.role) {
      return res.status(400).json({
        message: "Incorrect Credentials",
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
    };

    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    const isProduction = process.env.NODE_ENV === "production";

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        token,
        success: true,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error during login",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    return res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      })
      .json({
        message: "Logged out successfully",
        success: true,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error during logout",
      success: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills, uploadType } = req.body;
    const file = req.file;

    const userId = req.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.profile.bio = bio;
    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.profile.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === "string") {
        user.profile.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (file) {
      if (uploadType === "profilePhoto" || file.mimetype.startsWith("image/")) {
        user.profile.profilePhoto = await storePhotoResilient({ file, userId, req });
      } else {
        // Upload/replace resume
        await removeStoredResume(user);
        const stored = await storeResumeFile({ file, userId, req });
        user.profile.resume = stored.url;
        user.profile.resumeOriginalName = stored.originalName;
        user.profile.resumeFileId = stored.fileId;
        user.profile.resumeFileKey = stored.fileKey;
        user.profile.resumeUploadedAt = stored.uploadedAt;
        user.profile.resumeContentType = stored.contentType;
        user.profile.resumeSize = stored.size;
      }
    }

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Profile updated successfully ✅",
      user,
      success: true,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error during profile update",
      success: false,
    });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No image file provided",
        success: false,
      });
    }

    const userId = req.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    const photoUrl = await storePhotoResilient({ file, userId, req });
    user.profile.profilePhoto = photoUrl;
    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Profile photo updated successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.error("UpdateProfilePhoto Error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error during photo update",
      success: false,
    });
  }
};

/**
 * Dedicated Candidate Resume Upload / Replace Endpoint
 */
export const uploadResume = async (req, res) => {
  try {
    const userId = req.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Please select a resume file (PDF, DOC, or DOCX, max 5MB).",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
        success: false,
      });
    }

    // Clean up old file if replacing
    await removeStoredResume(user);

    // Store new file persistently
    const stored = await storeResumeFile({ file, userId, req });

    user.profile.resume = stored.url;
    user.profile.resumeOriginalName = stored.originalName;
    user.profile.resumeFileId = stored.fileId;
    user.profile.resumeFileKey = stored.fileKey;
    user.profile.resumeUploadedAt = stored.uploadedAt;
    user.profile.resumeContentType = stored.contentType;
    user.profile.resumeSize = stored.size;

    await user.save();

    const sanitizedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Resume uploaded successfully ✅",
      user: sanitizedUser,
      resumeUrl: stored.url,
      resumeOriginalName: stored.originalName,
      resumeUploadedAt: stored.uploadedAt,
      success: true,
    });
  } catch (error) {
    console.error("UploadResume Error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to upload resume. Please try again.",
      success: false,
    });
  }
};

/**
 * Dedicated Candidate Resume Delete Endpoint
 */
export const deleteResume = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
        success: false,
      });
    }

    if (!user.profile?.resume && !user.profile?.resumeFileId && !user.profile?.resumeFileKey) {
      return res.status(400).json({
        message: "No resume currently on file to delete.",
        success: false,
      });
    }

    // Clean up old stored file
    await removeStoredResume(user);

    user.profile.resume = "";
    user.profile.resumeOriginalName = "";
    user.profile.resumeFileId = null;
    user.profile.resumeFileKey = "";
    user.profile.resumeUploadedAt = null;
    user.profile.resumeContentType = "";
    user.profile.resumeSize = null;

    await user.save();

    const sanitizedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Resume removed successfully.",
      user: sanitizedUser,
      success: true,
    });
  } catch (error) {
    console.error("DeleteResume Error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to delete resume.",
      success: false,
    });
  }
};

/**
 * Secure Resume View Endpoint (Candidate self OR authorized recruiter)
 */
export const viewResume = async (req, res) => {
  try {
    const requesterId = req.id;
    const targetUserId = req.params.userId || requesterId;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        message: "Candidate profile not found.",
        success: false,
      });
    }

    if (!targetUser.profile?.resume && !targetUser.profile?.resumeFileId && !targetUser.profile?.resumeFileKey) {
      return res.status(404).json({
        message: "No resume has been uploaded for this candidate.",
        success: false,
      });
    }

    // Security check: Candidate can view their own resume; recruiters can only view applicants of their jobs
    if (requesterId.toString() !== targetUserId.toString()) {
      const recruiterUser = await User.findById(requesterId);
      if (!recruiterUser || recruiterUser.role !== "recruiter") {
        return res.status(403).json({
          message: "Unauthorized: You do not have permission to access this candidate's resume.",
          success: false,
        });
      }

      const userCompanies = await Company.find({ userId: requesterId }).select("_id");
      const companyIds = userCompanies.map((c) => c._id);

      const recruiterJobs = await Job.find({
        $or: [{ created_by: requesterId }, { company: { $in: companyIds } }],
      }).select("_id");
      const recruiterJobIds = recruiterJobs.map((j) => j._id);

      const applied = await Application.findOne({
        applicant: targetUserId,
        job: { $in: recruiterJobIds },
      });

      if (!applied) {
        return res.status(403).json({
          message: "Unauthorized: You can only view resumes of candidates who have applied to your job postings.",
          success: false,
        });
      }
    }

    const asDownload = req.query.download === "true";
    return await streamResume({
      user: targetUser,
      req,
      res,
      asDownload,
    });
  } catch (error) {
    console.error("ViewResume Error:", error.message);
    return res.status(500).json({
      message: error.message || "Failed to load resume file.",
      success: false,
    });
  }
};

/**
 * Secure Resume Download Endpoint
 */
export const downloadResume = async (req, res) => {
  req.query.download = "true";
  return viewResume(req, res);
};

export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;

    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required",
        success: false,
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (!user.bookmarks) {
      user.bookmarks = [];
    }

    const bookmarkIndex = user.bookmarks.findIndex(
      (id) => id.toString() === jobId.toString()
    );

    let isBookmarked = false;
    let message = "";

    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
      message = "Job removed from bookmarks";
    } else {
      user.bookmarks.push(jobId);
      isBookmarked = true;
      message = "Job saved for later";
    }

    await user.save();

    return res.status(200).json({
      message,
      isBookmarked,
      bookmarks: user.bookmarks,
      success: true,
    });
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getBookmarkedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      populate: {
        path: "company",
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      bookmarks: user.bookmarks || [],
      success: true,
    });
  } catch (error) {
    console.error("Error in getBookmarkedJobs:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const addSkill = async (req, res) => {
  try {
    const userId = req.id;
    const { skill } = req.body;

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      return res.status(400).json({
        message: "Skill name is required",
        success: false,
      });
    }

    const trimmedSkill = skill.trim();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (!user.profile) {
      user.profile = {};
    }
    if (!user.profile.skills) {
      user.profile.skills = [];
    }

    const exists = user.profile.skills.some(
      (s) => s.toLowerCase() === trimmedSkill.toLowerCase()
    );

    if (!exists) {
      user.profile.skills.push(trimmedSkill);
      await user.save();
    }

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: exists ? "Skill already added" : "Skill added successfully",
      skills: user.profile.skills,
      user: safeUser,
      success: true,
    });
  } catch (error) {
    console.error("Error in addSkill:", error);
    return res.status(500).json({
      message: error.message || "Failed to add skill",
      success: false,
    });
  }
};

export const removeSkill = async (req, res) => {
  try {
    const userId = req.id;
    const { skill } = req.body;

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      return res.status(400).json({
        message: "Skill name is required",
        success: false,
      });
    }

    const trimmedSkill = skill.trim().toLowerCase();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.profile?.skills) {
      user.profile.skills = user.profile.skills.filter(
        (s) => s.toLowerCase() !== trimmedSkill
      );
      await user.save();
    }

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Skill removed successfully",
      skills: user.profile.skills || [],
      user: safeUser,
      success: true,
    });
  } catch (error) {
    console.error("Error in removeSkill:", error);
    return res.status(500).json({
      message: error.message || "Failed to remove skill",
      success: false,
    });
  }
};

export const updateSkills = async (req, res) => {
  try {
    const userId = req.id;
    const { skills } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === "string") {
      parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Deduplicate preserving case of first occurrence
    const uniqueSkills = [];
    const seen = new Set();
    for (const sk of parsedSkills) {
      const lower = sk.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueSkills.push(sk);
      }
    }

    if (!user.profile) {
      user.profile = {};
    }
    user.profile.skills = uniqueSkills;
    await user.save();

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      message: "Skills updated successfully",
      skills: user.profile.skills,
      user: safeUser,
      success: true,
    });
  } catch (error) {
    console.error("Error in updateSkills:", error);
    return res.status(500).json({
      message: error.message || "Failed to update skills",
      success: false,
    });
  }
};
