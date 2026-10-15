import express from "express";
import { getBookmarkedJobs, login, logout, register, toggleBookmark, updateProfile, updateProfilePhoto } from "../controllers/user.controllers.js";
import authUser from "../middlewares/authUser.js";
import { singleUpload } from "../middlewares/multer.js";

const userRouter = express.Router()

userRouter.post("/register", singleUpload, register);
userRouter.post("/login", login)
userRouter.post("/logout", logout);
userRouter.post("/profile/update", authUser, singleUpload, updateProfile);
userRouter.post("/profile/photo", authUser, singleUpload, updateProfilePhoto);
userRouter.post("/bookmark/:id", authUser, toggleBookmark);
userRouter.get("/bookmarks", authUser, getBookmarkedJobs);

export default userRouter;


