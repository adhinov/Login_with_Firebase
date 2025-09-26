// routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { getUserProfile } from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Me (ambil user dari token)
router.get("/me", verifyToken, getUserProfile);

export default router;
