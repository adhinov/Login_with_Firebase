// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../models/userModel.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email dan password wajib diisi" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email sudah terdaftar" });
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
      role_id: newUser.role_id,
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
      return res
        .status(400)
        .json({ success: false, message: "Email dan password wajib diisi" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const previousLogin = user.last_login
      ? new Date(user.last_login).toISOString()
      : null;

    await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: getRoleString(user.role_id),
      role_id: user.role_id,
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
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang bisa login.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const previousLogin = user.last_login
      ? new Date(user.last_login).toISOString()
      : null;

    await updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: "admin",
      role_id: 1,
      last_login: previousLogin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
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

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // cek user
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email tidak ditemukan." });
    }

    const user = userQuery.rows[0];

    // buat token (15 menit)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_RESET_SECRET,
      { expiresIn: "15m" }
    );

    // dapatkan baseUrl dari env FRONTEND_URL (bisa berisi beberapa, pisah dengan koma)
    const rawUrls = (process.env.FRONTEND_URL || "").split(",").map(u => u.trim()).filter(Boolean);
    const baseUrl = rawUrls[1] || rawUrls[0] || process.env.DEFAULT_FRONTEND_URL || "http://localhost:3000";

    // pake query param agar tidak perlu dynamic folder [token]
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    // kirim email via Resend
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM || "no-reply@example.com";
    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset Password",
      html: `
        <p>Halo,</p>
        <p>Klik tautan berikut untuk mereset password kamu:</p>
        <p><a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a></p>
        <p>Link ini akan kedaluwarsa dalam 15 menit.</p>
      `,
    });

    console.log("✅ Email reset password terkirim:", response);
    return res.status(200).json({ success: true, message: "Email reset password berhasil dikirim." });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengirim email reset password.",
      // jangan kirim error detail ke client di production
    });
  }
};

// ====================== RESET PASSWORD ======================
// NOTE: untuk pendekatan ini kita menerima { token, newPassword } di body.
// Pastikan frontend memanggil POST /api/auth/reset-password dengan body tersebut.
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token dan password baru wajib diisi.",
      });
    }

    // verifikasi token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (err) {
      console.error("❌ Token reset invalid/expired:", err.message);
      return res.status(400).json({
        success: false,
        message: "Token tidak valid atau telah kedaluwarsa.",
      });
    }

    // cek user
    const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    // hash new password dan update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, decoded.id]);

    console.log(`✅ Password user ID ${decoded.id} berhasil direset.`);
    return res.status(200).json({ success: true, message: "Password berhasil direset. Silakan login kembali." });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
};


