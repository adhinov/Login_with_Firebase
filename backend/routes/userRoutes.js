// routes/userRoutes.js
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

import {
  getAllUsers,
  getChatUsers,
  updateProfile,
} from "../controllers/userController.js";

import uploadAvatar from "../middleware/uploadAvatar.js";

const router = express.Router();

/* ============================================================
   🔹 GET /api/users
   🔒 Hanya admin dapat melihat semua user
   ============================================================ */
router.get("/", verifyToken, isAdmin, getAllUsers);

/* ============================================================
   🔹 GET /api/users/chat-users
   🔒 User login dapat melihat daftar user untuk chat
   ============================================================ */
router.get("/chat-users", verifyToken, getChatUsers);

/* ============================================================
   🔹 PUT /api/users/update-profile
   🔒 User login: update username, phone, avatar
   ============================================================ */
router.put(
  "/update-profile",
  verifyToken,
  uploadAvatar.single("avatar"), // menerima avatar
  updateProfile
);

export default router;
