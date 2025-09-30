import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../models/userModel.js";

// ================= HELPER: mapping role_id → string =================
const getRoleString = (role_id) => {
  switch (role_id) {
    case 1:
      return "admin";
    case 2:
    default:
      return "user";
  }
};

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { email, password, username, phone_number } = req.body;

    // Cek apakah email sudah dipakai
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await createUser(
      email,
      hashedPassword,
      username,
      phone_number
    );

    const payload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: getRoleString(newUser.role_id), // 🔥 role string
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "Registrasi berhasil",
      token,
      user: payload,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN (USER & ADMIN) =================
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

    // Update last login
    const updated = await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: getRoleString(user.role_id), // 🔥 role string
      last_login: updated?.last_login || user.last_login,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login berhasil",
      token,
      user: payload,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN ADMIN ONLY =================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user || user.role_id !== 1) {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Hanya admin yang bisa login." });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const updated = await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: "admin", // 🔥 role fix string
      last_login: updated?.last_login || user.last_login,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login admin berhasil",
      token,
      user: payload,
    });
  } catch (error) {
    console.error("❌ Login admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      message: "User profile fetched",
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role, // ✅ sudah string dari token
        last_login: req.user.last_login,
      },
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
