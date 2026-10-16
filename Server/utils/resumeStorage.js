import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import cloudinary from "./cloudinary.js";
import getDataUri from "./datauri.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local storage directories exist
const uploadsBaseDir = path.join(__dirname, "..", "uploads");
const resumesDir = path.join(uploadsBaseDir, "resumes");
const photosDir = path.join(uploadsBaseDir, "photos");

try {
  if (!fs.existsSync(uploadsBaseDir)) fs.mkdirSync(uploadsBaseDir, { recursive: true });
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });
  if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
} catch (err) {
  console.warn("[resumeStorage] Directory creation notice:", err.message);
}

// 5MB max file size
export const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export const ALLOWED_RESUME_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_RESUME_EXTS = [".pdf", ".doc", ".docx"];

/**
 * Get Mongoose GridFS Bucket for resumes
 */
export const getResumeGridFSBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database not connected for GridFS operations.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "resumes",
  });
};

/**
 * Validates resume file buffer, MIME type, and size
 */
export const validateResumeFile = (file) => {
  if (!file) {
    return { valid: false, message: "No file provided. Please select a resume file." };
  }

  if (file.size > MAX_RESUME_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the 5 MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
    };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const mimeValid = ALLOWED_RESUME_MIMES.includes(mime);
  const extValid = ALLOWED_RESUME_EXTS.includes(ext);

  if (!mimeValid && !extValid) {
    return {
      valid: false,
      message: "Unsupported file type. Only PDF (.pdf) and Word documents (.doc, .docx) are allowed.",
    };
  }

  return { valid: true };
};

/**
 * Determines current base URL for generating absolute links
 */
export const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  if (req) {
    const protocol = req.headers?.["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get ? req.get("host") : (req.headers?.host || "localhost:8000");
    return `${protocol}://${host}`;
  }
  return "http://localhost:8000";
};

/**
 * Stores a resume file with hybrid persistence:
 * 1. MongoDB GridFS (guaranteed persistence across any deployment / redeployment)
 * 2. Local disk cache (/uploads/resumes/)
 * 3. Cloudinary (if credentials configured and reachable)
 */
export const storeResumeFile = async ({ file, userId, req }) => {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.statusCode = 400;
    throw err;
  }

  const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
  const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const localFilename = `resume_${userId}_${Date.now()}_${sanitizedOriginal}`;

  // 1. Save to local disk cache
  try {
    const localFilePath = path.join(resumesDir, localFilename);
    fs.writeFileSync(localFilePath, file.buffer);
  } catch (diskErr) {
    console.warn("[resumeStorage] Local disk write warning:", diskErr.message);
  }

  // 2. Save to MongoDB GridFS (permanent across all server instances & redeployments)
  let gridFSId = null;
  try {
    const bucket = getResumeGridFSBucket();
    const uploadStream = bucket.openUploadStream(localFilename, {
      contentType: file.mimetype || "application/pdf",
      metadata: {
        userId: userId.toString(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date(),
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        gridFSId = uploadStream.id;
        resolve();
      });
      uploadStream.on("error", reject);
      const readable = Readable.from(file.buffer);
      readable.pipe(uploadStream);
    });
  } catch (gridErr) {
    console.error("[resumeStorage] GridFS save error:", gridErr.message);
  }

  // 3. Optional: Attempt Cloudinary upload with short timeout (if configured)
  let cloudUrl = null;
  let cloudPublicId = null;
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_SECRET_KEY
  );

  if (hasCloudinary) {
    try {
      const fileUri = getDataUri(file);
      const cloudUploadPromise = cloudinary.uploader.upload(fileUri.content, {
        resource_type: "auto",
        folder: "joborbit_resumes",
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Cloudinary timeout")), 4000)
      );

      const cloudRes = await Promise.race([cloudUploadPromise, timeoutPromise]);
      if (cloudRes && cloudRes.secure_url) {
        cloudUrl = cloudRes.secure_url;
        cloudPublicId = cloudRes.public_id;
      }
    } catch (cloudErr) {
      console.warn("[resumeStorage] Cloudinary upload skipped / failed:", cloudErr.message);
      // Fallback seamlessly to GridFS / local URL
    }
  }

  // Generate canonical persistent URL
  const baseUrl = getBaseUrl(req);
  const serveUrl = cloudUrl || `${baseUrl}/api/v1/user/resume/view/${userId}`;

  return {
    url: serveUrl,
    originalName: file.originalname,
    contentType: file.mimetype || "application/pdf",
    size: file.size,
    fileId: gridFSId,
    fileKey: localFilename,
    cloudPublicId: cloudPublicId,
    uploadedAt: new Date(),
  };
};

/**
 * Safely removes a stored resume from GridFS, local disk, and Cloudinary
 */
export const removeStoredResume = async (user) => {
  if (!user || !user.profile) return;

  // 1. Remove from GridFS
  if (user.profile.resumeFileId) {
    try {
      const bucket = getResumeGridFSBucket();
      await bucket.delete(new mongoose.Types.ObjectId(user.profile.resumeFileId));
    } catch (err) {
      console.warn("[resumeStorage] GridFS delete warning:", err.message);
    }
  }

  // 2. Remove from local disk
  if (user.profile.resumeFileKey) {
    try {
      const localFilePath = path.join(resumesDir, user.profile.resumeFileKey);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (err) {
      console.warn("[resumeStorage] Local disk delete warning:", err.message);
    }
  }

  // 3. Remove from Cloudinary if stored there
  if (user.profile.resume && user.profile.resume.includes("cloudinary")) {
    try {
      const publicId = user.profile.resumeFileKey;
      if (publicId && !publicId.startsWith("resume_")) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
    } catch (err) {
      console.warn("[resumeStorage] Cloudinary delete warning:", err.message);
    }
  }
};

/**
 * Streams a resume to the response:
 * - Checks GridFS
 * - Checks local disk
 * - Redirects to Cloudinary URL if remote
 */
export const streamResume = async ({ user, req, res, asDownload = false }) => {
  if (!user || !user.profile || (!user.profile.resume && !user.profile.resumeFileId && !user.profile.resumeFileKey)) {
    return res.status(404).json({
      message: "No resume found for this user.",
      success: false,
    });
  }

  const filename = user.profile.resumeOriginalName || `Resume_${user.fullname.replace(/\s+/g, "_")}.pdf`;
  const contentType = user.profile.resumeContentType || "application/pdf";
  const dispositionType = asDownload ? "attachment" : "inline";

  // Case 1: Stream from MongoDB GridFS
  if (user.profile.resumeFileId) {
    try {
      const bucket = getResumeGridFSBucket();
      const fileId = new mongoose.Types.ObjectId(user.profile.resumeFileId);

      // Verify file exists in GridFS
      const files = await bucket.find({ _id: fileId }).toArray();
      if (files && files.length > 0) {
        const fileDoc = files[0];
        res.setHeader("Content-Type", fileDoc.contentType || contentType);
        res.setHeader(
          "Content-Disposition",
          `${dispositionType}; filename="${encodeURIComponent(filename)}"`
        );
        if (fileDoc.length) {
          res.setHeader("Content-Length", fileDoc.length);
        }

        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on("error", (err) => {
          console.error("[resumeStorage] GridFS stream error:", err.message);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to stream resume file.", success: false });
          }
        });
        return downloadStream.pipe(res);
      }
    } catch (err) {
      console.warn("[resumeStorage] GridFS read error, attempting disk fallback:", err.message);
    }
  }

  // Case 2: Stream from local disk cache
  if (user.profile.resumeFileKey) {
    const localFilePath = path.join(resumesDir, user.profile.resumeFileKey);
    if (fs.existsSync(localFilePath)) {
      const stat = fs.statSync(localFilePath);
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="${encodeURIComponent(filename)}"`
      );
      res.setHeader("Content-Length", stat.size);
      return fs.createReadStream(localFilePath).pipe(res);
    }
  }

  // Case 3: If Cloudinary or remote URL
  if (user.profile.resume && user.profile.resume.startsWith("http")) {
    return res.redirect(user.profile.resume);
  }

  return res.status(404).json({
    message: "Resume file content is not available on the server.",
    success: false,
  });
};
