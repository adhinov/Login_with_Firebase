import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../models/userModel.js";
import nodemailer from "nodemailer"; // ✅ Brevo SMTP

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

// ====================== FORGOT PASSWORD (SMTP Brevo) ======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log("📨 [ForgotPassword] Request diterima:", email);

  try {
    // 🧩 Cek environment variables
    const requiredEnv = [
      "JWT_RESET_SECRET",
      "FRONTEND_URL",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "FROM_EMAIL",
    ];

    for (const key of requiredEnv) {
      if (!process.env[key]) {
        console.error(`❌ Missing environment variable: ${key}`);
        return res.status(500).json({
          success: false,
          message: `Server error: environment variable ${key} belum diatur.`,
        });
      }
    }

    // 🔍 Cek apakah email terdaftar
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      console.warn(`⚠️ Email tidak ditemukan: ${email}`);
      return res.status(404).json({
        success: false,
        message: "Email tidak ditemukan. Pastikan email sudah terdaftar.",
      });
    }

    const user = userQuery.rows[0];

    // 🔐 Buat token reset (15 menit)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_RESET_SECRET,
      { expiresIn: "15m" }
    );

    // 🌐 Buat tautan reset password (frontend)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    // ✉️ Konfigurasi transporter SMTP Brevo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 🧪 Uji koneksi SMTP (optional, tapi berguna untuk debug)
    await transporter.verify();
    console.log("✅ SMTP transporter siap digunakan.");

    // 📩 Kirim email reset password
    const mailOptions = {
      from: `"Login App" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Reset Password - Login App",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2 style="color:#4f46e5;">Reset Password Akun Anda</h2>
          <p>Halo ${user.username || "User"},</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <a href="${resetLink}" 
             style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;
             border-radius:6px;text-decoration:none;">Reset Password</a>
          <p style="margin-top:16px;">Tautan ini berlaku selama 15 menit.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email reset password terkirim ke: ${email}`);
    console.log("📧 Brevo Response:", info.messageId || info.response);

    res.status(200).json({
      success: true,
      message:
        "Email reset password berhasil dikirim. Silakan cek inbox atau folder spam Anda.",
    });
  } catch (error) {
    console.error("❌ Forgot password error (SMTP Brevo):", error.message);
    res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat mengirim email reset password. Silakan coba lagi nanti.",
      error: error.message,
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

    console.log(`✅ Password user ID ${decoded.id} berhasil direset.`);

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
