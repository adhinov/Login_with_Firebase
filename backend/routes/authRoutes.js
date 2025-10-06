// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  loginAdmin,
  getUserProfile,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { forgotPassword, resetPassword } from "../controllers/authController.js";

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

//forgot password
router.post("/forgot-password", forgotPassword);

//reset password
router.post("/reset-password/:token", resetPassword);

export default router;
