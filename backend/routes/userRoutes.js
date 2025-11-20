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

router.get("/", verifyToken, isAdmin, getAllUsers);
router.get("/chat-users", verifyToken, getChatUsers);

router.put(
  "/update-profile",
  verifyToken,
  uploadAvatar.single("avatar"),
  updateProfile
);

export default router;
