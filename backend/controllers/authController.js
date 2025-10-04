// controllers/authController.js
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

// ================= HELPER: konversi tanggal ke UTC+7 ISO =================
const toJakartaISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const jakartaTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return jakartaTime.toISOString();
};

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { email, password, username, phone_number } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email dan password wajib diisi" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser(
      email,
      hashedPassword,
      username || null,
      phone_number || null
    );

    const payload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: getRoleString(newUser.role_id),
      last_login: null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      token,
      user: payload,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= LOGIN (USER & ADMIN) =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email dan password wajib diisi" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email atau password salah" });
    }

    const previousLogin = toJakartaISO(user.last_login);
    await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: getRoleString(user.role_id),
      last_login: previousLogin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: payload,
      previousLogin,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= LOGIN ADMIN ONLY =================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user || user.role_id !== 1) {
      return res.status(403).json({ success: false, message: "Akses ditolak. Hanya admin yang bisa login." });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email atau password salah" });
    }

    const previousLogin = toJakartaISO(user.last_login);
    await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: "admin",
      last_login: previousLogin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      message: "Login admin berhasil",
      token,
      user: payload,
      previousLogin,
    });
  } catch (error) {
    console.error("❌ Login admin error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      message: "User profile fetched",
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        last_login: toJakartaISO(req.user.last_login),
      },
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
