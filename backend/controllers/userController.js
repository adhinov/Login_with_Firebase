// controllers/userController.js
import db from "../config/db.js";
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
   📌 Konfigurasi Upload Avatar (multer)
   ============================================================ */
const avatarsDir = path.join(process.cwd(), "uploads", "avatars");

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
   🔹 GET ALL USERS (ADMIN)
   ============================================================ */
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, avatar FROM users ORDER BY id ASC"
    );

    const users = rows.map((u) => ({
      ...u,
      avatar: safeAvatar(u.avatar),
    }));

    res.json(users);
  } catch (error) {
    console.error("❌ Error getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   🔹 GET CHAT USERS (FOR CHAT LIST)
   ============================================================ */
export const getChatUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, avatar FROM users ORDER BY id ASC"
    );

    const users = rows.map((u) => ({
      ...u,
      avatar: safeAvatar(u.avatar),
    }));

    res.json(users);
  } catch (error) {
    console.error("❌ Error getChatUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   PUT /api/users/update-profile
   logged user: update username, phone, avatar
   ============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone } = req.body;

    // new avatar path (if uploaded)
    const newAvatar = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    // ambil avatar lama dari DB
    const oldRes = await pool.query("SELECT avatar FROM users WHERE id = $1", [userId]);
    if (!oldRes.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const oldAvatar = oldRes.rows[0].avatar;

    // jika ada avatar baru dan ada old avatar (bukan default) → hapus file lama
    if (newAvatar && oldAvatar && oldAvatar !== DEFAULT_AVATAR) {
      try {
        const oldFull = path.join(process.cwd(), oldAvatar.startsWith("/") ? oldAvatar.slice(1) : oldAvatar);
        if (fs.existsSync(oldFull)) fs.unlinkSync(oldFull);
      } catch (e) {
        // jangan crash kalau hapus gagal — hanya log
        console.warn("Warn: gagal hapus old avatar:", e);
      }
    }

    const finalAvatar = newAvatar || oldAvatar || DEFAULT_AVATAR;

    // update user — gunakan parameterized query postgres ($1..)
    const updateQuery = `
      UPDATE users
      SET 
        username = COALESCE($1, username),
        phone_number = COALESCE($2, phone_number),
        avatar = $3
      WHERE id = $4
      RETURNING id, email, username, phone_number, avatar, created_at, last_login
    `;

    const { rows } = await pool.query(updateQuery, [
      username || null,
      phone || null,
      finalAvatar,
      userId,
    ]);

    const updated = rows[0];

    res.json({
      message: "Profile updated",
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        phone: updated.phone_number,
        avatar: safeAvatar(updated.avatar),
        createdAt: toJakartaISO(updated.created_at),
        lastLogin: toJakartaISO(updated.last_login),
      },
    });
  } catch (error) {
    console.error("❌ Error updateProfile:", error);
    res.status(500).json({ message: "Gagal update profile" });
  }
};

