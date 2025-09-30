// routes/userRoutes.js
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getAllUsers } from "../controllers/userController.js";

const router = express.Router();

// ✅ Hanya admin yang bisa akses semua user
router.get("/", verifyToken, isAdmin, getAllUsers);

export default router;
