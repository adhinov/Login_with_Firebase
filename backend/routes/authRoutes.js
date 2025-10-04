// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  loginAdmin,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// ================= AUTH ROUTES =================

// Register user baru
// POST /api/auth/register
router.post("/register", register);

// Login user (role: "user" atau "admin")
// POST /api/auth/login
router.post("/login", login);

// Login khusus admin (role harus "admin")
// POST /api/auth/admin/login
router.post("/admin/login", loginAdmin);

// Ambil profile user dari JWT
// GET /api/auth/me
router.get("/me", verifyToken, (req, res) => {
  try {
    // verifyToken sudah inject data token ke req.user
    res.json({ 
      success: true,
      user: req.user 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Terjadi kesalahan server" });
  }
});

export default router;
