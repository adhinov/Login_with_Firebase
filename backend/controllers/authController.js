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

  try {
    console.log("📨 [ForgotPassword] Request diterima:", email);

    // 1️⃣ Cek apakah user ada di database
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      console.log("⚠️ Email tidak terdaftar:", email);
      return res.status(404).json({ message: "Email tidak terdaftar." });
    }

    const user = userQuery.rows[0];

    // 2️⃣ Buat token reset password (berlaku 15 menit)
    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 3️⃣ Buat link reset password (PAKAI QUERY PARAMETER SESUAI FRONTEND)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 4️⃣ Kirim email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: "Reset Password - Login with Firebase",
        html: `
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Klik tautan berikut untuk mereset password Anda:</p>
          <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
          <p><b>Catatan:</b> Link ini hanya berlaku selama 15 menit.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        `,
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return res.status(500).json({ message: "Gagal mengirim email reset password." });
      }

      console.log("✅ Email reset password terkirim:", data);
      return res
        .status(200)
        .json({ message: "Link reset password telah dikirim ke email Anda." });

    } catch (emailError) {
      console.error("❌ Gagal mengirim email:", emailError);
      return res.status(500).json({ message: "Terjadi kesalahan saat mengirim email." });
    }
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
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
