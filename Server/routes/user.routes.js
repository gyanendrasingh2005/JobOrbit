import express from "express";
import {
  getBookmarkedJobs,
  login,
  logout,
  register,
  toggleBookmark,
  updateProfile,
  updateProfilePhoto,
  uploadResume,
  deleteResume,
  viewResume,
  downloadResume,
  addSkill,
  removeSkill,
  updateSkills,
} from "../controllers/user.controllers.js";
import authUser from "../middlewares/authUser.js";
import { singleUpload, resumeUpload } from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/register", singleUpload, register);
userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.post("/profile/update", authUser, singleUpload, updateProfile);
userRouter.post("/profile/photo", authUser, singleUpload, updateProfilePhoto);
userRouter.post("/profile/resume", authUser, resumeUpload, uploadResume);
userRouter.delete("/profile/resume", authUser, deleteResume);
userRouter.get("/resume/view/:userId?", authUser, viewResume);
userRouter.get("/resume/download/:userId?", authUser, downloadResume);
userRouter.post("/profile/skills/add", authUser, addSkill);
userRouter.post("/profile/skills/remove", authUser, removeSkill);
userRouter.put("/profile/skills", authUser, updateSkills);
userRouter.post("/bookmark/:id", authUser, toggleBookmark);
userRouter.get("/bookmarks", authUser, getBookmarkedJobs);

export default userRouter;


