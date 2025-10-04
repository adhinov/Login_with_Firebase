// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  loginAdmin,
  getUserProfile,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// ================= AUTH ROUTES =================

// Register user baru
router.post("/register", register);

// Login user (role: "user" atau "admin")
router.post("/login", login);

// Login khusus admin
router.post("/admin/login", loginAdmin);

// Ambil profile user berdasarkan token JWT
router.get("/me", verifyToken, getUserProfile);

export default router;
