// routes/userRoutes.js
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getAllUsers, getChatUsers } from "../controllers/userController.js";

const router = express.Router();

// 🔒 Hanya admin yang bisa ambil semua user
router.get("/", verifyToken, isAdmin, getAllUsers);

// ✅ Semua user login bisa lihat daftar user lain untuk chat
router.get("/chat-users", verifyToken, getChatUsers);

export default router;
