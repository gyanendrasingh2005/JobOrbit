import { User } from "../models/user.model.js";
import { Job } from "../models/job.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// Helper: upload to Cloudinary with a 30-second timeout
const uploadToCloudinary = (content, options = {}) => {
  const uploadPromise = cloudinary.uploader.upload(content, options);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Cloudinary upload timed out. Check your Cloudinary credentials.")),
      30000
    )
  );
  return Promise.race([uploadPromise, timeoutPromise]);
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
    let cloudResponse = "";
    if (file) {
      const fileUri = getDataUri(file);
      cloudResponse = await uploadToCloudinary(fileUri.content);
    }

    const existedUser = await User.findOne({ email: email });
    if (existedUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let url = null;
    if (file && cloudResponse) {
      url = cloudResponse.secure_url;
    }

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
      expiresIn: "1d",
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
        maxAge: 1 * 24 * 60 * 60 * 1000,
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

    let cloudResponse = null;

    // file upload
    if (file) {
      const fileUri = getDataUri(file);
      cloudResponse = await uploadToCloudinary(fileUri.content, {
        resource_type: "auto",
      });
    }

    let skillsArray;
    if (skills) {
      skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

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
    if (skills) user.profile.skills = skillsArray;

    if (file && cloudResponse) {
      if (uploadType === "profilePhoto") {
        // Save as profile photo
        user.profile.profilePhoto = cloudResponse.secure_url;
      } else {
        // Default: save as resume
        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = file.originalname;
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
      message: "Profile updated",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
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

    const fileUri = getDataUri(file);
    const cloudResponse = await uploadToCloudinary(fileUri.content, {
      resource_type: "image",
      folder: "profile_photos",
    });

    const userId = req.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    user.profile.profilePhoto = cloudResponse.secure_url;
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
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error during photo update",
      success: false,
    });
  }
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
