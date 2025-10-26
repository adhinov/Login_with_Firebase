import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../models/userModel.js";
import { Resend } from "resend";
import nodemailer from "nodemailer";

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
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
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

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Token tidak valid" });
    }

    const result = await pool.query(
      "SELECT id, email, username, role_id, created_at, last_login FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
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
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil profil user" });
  }
};

// ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log("📨 [ForgotPassword] Request diterima:", email);

  try {
    // ✅ Cek user dari PostgreSQL
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan." });
    }

    // ✅ Buat token reset password
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // ✅ Buat link reset password ke frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // ✅ Kirim email pakai Resend
    const emailResponse = await resend.emails.send({
      from: `${process.env.FROM_NAME || "Login App"} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Reset Password Request",
      html: `
        <p>Halo,</p>
        <p>Kami menerima permintaan reset password untuk akun Anda.</p>
        <p>Klik link di bawah ini untuk mengatur ulang password Anda:</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
        <p>Link ini hanya berlaku selama 15 menit.</p>
      `,
    });

    console.log("✅ Email reset password terkirim:", emailResponse);

    if (emailResponse.error) {
      console.error("❌ Resend error:", emailResponse.error);
      return res.status(500).json({ message: "Gagal mengirim email." });
    }

    res.status(200).json({ message: "Link reset password telah dikirim ke email Anda." });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat memproses permintaan." });
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

    // ✅ Verifikasi token (gunakan secret yang sama seperti saat buat token)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("❌ Token reset invalid/expired:", err.message);
      return res.status(400).json({
        success: false,
        message: "Token tidak valid atau telah kedaluwarsa.",
      });
    }

    // ✅ Cari user berdasarkan email dari token
    const userResult = await pool.query("SELECT id, email FROM users WHERE email = $1", [decoded.email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // ✅ Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
      hashedPassword,
      decoded.email,
    ]);

    console.log(`✅ Password untuk ${decoded.email} berhasil direset.`);

    res.status(200).json({
      success: true,
      message: "Password berhasil direset. Silakan login kembali.",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

