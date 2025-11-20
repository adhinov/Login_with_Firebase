import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

import {
  getAllUsers,
  getChatUsers,
  updateProfile,
} from "../controllers/userController.js";

import { uploadAvatar } from "../middleware/cloudinaryAvatarUpload.js";

const router = express.Router();

// ============================
// ADMIN — GET ALL USERS
// ============================
router.get("/", verifyToken, isAdmin, getAllUsers);

// ============================
// GET CHAT USERS (semua user kecuali diri sendiri)
// ============================
router.get("/chat-users", verifyToken, getChatUsers);

// ============================
// UPDATE PROFILE + UPLOAD AVATAR via Cloudinary
// ============================
router.put(
  "/update-profile",
  verifyToken,
  uploadAvatar.single("avatar"),
  updateProfile
);

export default router;
