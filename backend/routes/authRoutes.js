// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  loginAdmin,
  getUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Register user baru
router.post("/register", register);

// Login user umum
router.post("/login", login);

// Login khusus admin
router.post("/admin/login", loginAdmin);

// Ambil profil user berdasarkan token
router.get("/me", verifyToken, getUserProfile);

// Lupa password
router.post("/forgot-password", forgotPassword);

// Reset password (gunakan body, bukan param)
router.post("/reset-password", resetPassword);

export default router;
