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

// 🧩 Cek koneksi route
router.get("/", (req, res) => {
  res.json({
    status: "✅ Auth routes aktif",
    message: "Koneksi ke /api/auth berhasil",
    endpoints: [
      "POST /register",
      "POST /login",
      "POST /admin/login",
      "POST /forgot-password",
      "POST /reset-password",
      "GET /me",
    ],
  });
});

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
