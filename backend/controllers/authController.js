// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser, updateLastLogin } from "../models/userModel.js";

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { email, password, username, phone_number } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser(email, hashedPassword, username, phone_number);

    res.status(201).json({
      message: "Registrasi berhasil",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role_id: newUser.role_id,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    await updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role_id: user.role_id,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // req.user berasal dari verifyToken (decoded JWT)
    res.json({
      message: "User profile fetched",
      user: req.user,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
