import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../models/userModel.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// default avatar (sama dengan di userController)
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/ddoqewccs/image/upload/v1733640000/login-app/avatars/default.svg";

// helper: role mapping
const getRoleString = (role_id) => {
  switch (role_id) {
    case 1:
      return "admin";
    case 2:
    default:
      return "user";
  }
};

// helper: fetch avatar for user id (fallback ke default)
const getAvatarForUserId = async (userId) => {
  try {
    const r = await pool.query("SELECT avatar FROM users WHERE id = $1", [
      userId,
    ]);
    if (r.rows.length === 0) return DEFAULT_AVATAR;
    const a = r.rows[0].avatar;
    return a ? a : DEFAULT_AVATAR;
  } catch (err) {
    console.error("Error getAvatarForUserId:", err);
    return DEFAULT_AVATAR;
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

    // pastikan kita ambil avatar terbaru dari DB (createUser kadang tidak mengembalikan avatar)
    const avatar = await getAvatarForUserId(newUser.id);

    const payload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: getRoleString(newUser.role_id),
      role_id: newUser.role_id,
      avatar,
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

    // ambil avatar terbaru dari DB (jika model tidak menyertakan)
    const avatar = (user.avatar && user.avatar !== "") ? user.avatar : await getAvatarForUserId(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: getRoleString(user.role_id),
      role_id: user.role_id,
      last_login: previousLogin,
      avatar,
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

    const avatar = (user.avatar && user.avatar !== "") ? user.avatar : await getAvatarForUserId(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: "admin",
      role_id: 1,
      last_login: previousLogin,
      avatar,
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
      "SELECT id, email, username, role_id, avatar, created_at, last_login FROM users WHERE id = $1",
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
        avatar: user.avatar ? user.avatar : DEFAULT_AVATAR,
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
    // 1️⃣ Cek apakah email terdaftar di database
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "Email tidak ditemukan." });
    }

    // 2️⃣ Buat token reset password berlaku 15 menit
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 3️⃣ Buat URL untuk halaman reset password (frontend)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 4️⃣ Kirim email dengan Resend
    const { data, error } = await resend.emails.send({
      from: "Login App <onboarding@resend.dev>", // ✅ format wajib benar
      to: email,
      subject: "Reset Password - Login App",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Reset Password</h2>
          <p>Hai ${user.username || "pengguna"},</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Silakan klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
          <a href="${resetLink}"
             style="display:inline-block;padding:10px 20px;margin-top:10px;
             background-color:#22c55e;color:white;text-decoration:none;
             border-radius:5px;">Reset Password</a>
          <p style="margin-top:20px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <hr>
          <p style="font-size:12px;color:#777;">Link ini berlaku selama 15 menit.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim email reset password.",
        error,
      });
    }

    console.log("✅ Email reset password terkirim:", data);

    // 5️⃣ Respon sukses ke frontend
    res.status(200).json({
      success: true,
      message: "Link reset password telah dikirim ke email Anda.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
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

// ================= GET CURRENT USER (/api/auth/me) =================
export const me = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    const result = await pool.query(
      `SELECT id, email, username, phone_number, avatar, role_id 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const u = result.rows[0];

    res.json({
      id: u.id,
      email: u.email,
      username: u.username,
      phone: u.phone_number,
      role: u.role_id === 1 ? "admin" : "user",
      avatar: safeAvatar(u.avatar), // ⬅ WAJIB! agar avatar TIDAK hilang
    });
  } catch (error) {
    console.error("❌ /api/auth/me error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
