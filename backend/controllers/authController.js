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

// ================= GET USER PROFILE (/api/auth/me) =================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Token tidak valid" });
    }

    const result = await pool.query(
      "SELECT id, email, username, role_id, created_at, last_login FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        ...user,
        role: getRoleString(user.role_id),
      },
    });
  } catch (error) {
    console.error("❌ Error getUserProfile:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil profil user" });
  }
};

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 🔍 Cek apakah email ada di database
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email tidak ditemukan. Pastikan email yang dimasukkan sudah terdaftar.",
      });
    }

    const user = userQuery.rows[0];

    // 🔐 Buat token reset (kedaluwarsa 15 menit)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_RESET_SECRET,
      { expiresIn: "15m" }
    );

    // 🌐 Ambil URL frontend dari environment (bisa 1 atau beberapa domain)
    const rawUrls = (process.env.FRONTEND_URL || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    const baseUrl =
      rawUrls[1] || rawUrls[0] || "https://login-with-firebase-sandy.vercel.app";

    // 🔗 Buat link reset password
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    // ✉️ Kirim email reset password (global)
    const fromEmail = process.env.FROM_EMAIL || "Login App <noreply@login-app.com>";

    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset Password - Login App",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #4f46e5; text-align: center;">Reset Password Akun Anda</h2>
          <p>Halo ${user.username || "User"},</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda di <strong>Login App</strong>.</p>
          <p>Silakan klik tombol di bawah ini untuk melanjutkan proses reset password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" target="_blank" rel="noopener noreferrer"
              style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #555;">
            Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
          </p>
          <p style="font-size: 13px; word-break: break-all; color: #666;">
            <a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a>
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 13px; color: #999; text-align: center;">
            Link ini akan kedaluwarsa dalam 15 menit.<br />
            Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
          <p style="font-size: 13px; color: #aaa; text-align: center;">
            &copy; ${new Date().getFullYear()} Login App. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`✅ Email reset password terkirim ke: ${email}`, response);

    return res.status(200).json({
      success: true,
      message:
        "Email reset password berhasil dikirim. Silakan cek inbox atau folder spam pada email Anda.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat mengirim email reset password. Silakan coba lagi beberapa saat.",
    });
  }
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token dan password baru wajib diisi.",
      });
    }

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

    const userResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      decoded.id,
    ]);

    console.log(`✅ Password user ID ${decoded.id} (${userResult.rows[0].email}) berhasil direset.`);

    return res.status(200).json({
      success: true,
      message: "Password berhasil direset. Silakan login kembali dengan password baru.",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
};


