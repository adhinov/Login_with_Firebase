// controllers/userController.js
import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import multer from "multer";

/* ============================================================
   📌 Konversi tanggal ke UTC+7 (Jakarta)
   ============================================================ */
export const toJakartaISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const jakartaTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return jakartaTime.toISOString();
};

/* ============================================================
   📌 Default Avatar + Safe Avatar Checker
   ============================================================ */
const DEFAULT_AVATAR = "/uploads/avatars/default.svg";

export const safeAvatar = (avatarPath) => {
  if (!avatarPath) return DEFAULT_AVATAR;
  const filePath = path.join(process.cwd(), avatarPath.replace(/^\//, ""));
  return fs.existsSync(filePath) ? avatarPath : DEFAULT_AVATAR;
};

/* ============================================================
   📌 Konfigurasi Upload Avatar (Multer)
   ============================================================ */
const avatarsDir = path.join(process.cwd(), "uploads", "avatars");

// Pastikan folder ada
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log("📁 Avatar folder created:", avatarsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// Validasi gambar
const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpg|jpeg|png|webp|svg)$/;
  const allowedMime =
    /(image\/jpeg|image\/jpg|image\/png|image\/webp|image\/svg\+xml)/;

  const isExtValid = allowedExt.test(file.originalname.toLowerCase());
  const isMimeValid = allowedMime.test(file.mimetype);

  if (isExtValid && isMimeValid) cb(null, true);
  else cb(new Error("Invalid file type. Image only."), false);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ============================================================
   🔹 GET /api/users
   🔒 Admin: melihat semua user
   ============================================================ */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         u.id, 
         u.email, 
         COALESCE(u.username, '') AS username,
         r.name AS role, 
         u.created_at,
         COALESCE(u.phone_number, '') AS phone_number,
         u.last_login,
         u.avatar
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.id ASC`
    );

    const users = result.rows.map((u) => ({
      ...u,
      avatar: safeAvatar(u.avatar),
      created_at: toJakartaISO(u.created_at),
      last_login: toJakartaISO(u.last_login),
    }));

    res.json(users);
  } catch (error) {
    console.error("❌ Error getAllUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil data users" });
  }
};

/* ============================================================
   🔹 GET /api/users/chat-users
   🔒 User login: melihat daftar user lain
   ============================================================ */
export const getChatUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, email, COALESCE(username, '') AS username, avatar
       FROM users
       WHERE id != $1
       AND email != 'admin@example.com'
       ORDER BY id ASC`,
      [userId]
    );

    const formatted = result.rows.map((u) => ({
      ...u,
      avatar: safeAvatar(u.avatar),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error getChatUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil daftar user untuk chat" });
  }
};

/* ============================================================
   🔹 PUT /api/users/update-profile
   🔒 User login: update username, phone, avatar
   ============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username, phone } = req.body;

    const newAvatar = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : null;

    // Ambil avatar lama
    const oldUser = await pool.query(
      "SELECT avatar FROM users WHERE id=$1",
      [userId]
    );

    const oldAvatar = oldUser.rows[0]?.avatar;

    // Hapus avatar lama jika upload baru
    if (newAvatar && oldAvatar) {
      const oldPath = path.join(
        process.cwd(),
        oldAvatar.replace(/^\//, "")
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update database
    const result = await pool.query(
      `UPDATE users 
       SET username=$1, phone_number=$2, avatar = COALESCE($3, avatar)
       WHERE id=$4
       RETURNING id, email, username, phone_number, avatar, created_at, last_login`,
      [username, phone, newAvatar, userId]
    );

    const u = result.rows[0];

    res.json({
      message: "Profile updated",
      user: {
        id: u.id,
        email: u.email,
        username: u.username,
        phone: u.phone_number,
        avatar: safeAvatar(u.avatar),
        createdAt: toJakartaISO(u.created_at),
        lastLogin: toJakartaISO(u.last_login),
      },
    });
  } catch (error) {
    console.error("❌ Error updateProfile:", error);
    res.status(500).json({ message: "Gagal update profile" });
  }
};
