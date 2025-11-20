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
   🔹 UPDATE PROFILE (username + phone + avatar)
   ============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone } = req.body;

    let newAvatarUrl = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : null;

    // Ambil avatar lama
    const [oldRows] = await db.query(
      "SELECT avatar FROM users WHERE id = ?",
      [userId]
    );

    let oldAvatar = oldRows[0]?.avatar;

    // Hapus avatar lama jika upload avatar baru (kecuali default)
    if (
      newAvatarUrl &&
      oldAvatar &&
      oldAvatar !== DEFAULT_AVATAR &&
      fs.existsSync("." + oldAvatar)
    ) {
      fs.unlinkSync("." + oldAvatar);
    }

    const finalAvatar = newAvatarUrl || oldAvatar;

    // Update ke DB
    await db.query(
      `
      UPDATE users SET 
        username = COALESCE(?, username),
        phone_number = COALESCE(?, phone_number),
        avatar = ?
      WHERE id = ?
      `,
      [username || null, phone || null, finalAvatar, userId]
    );

    res.json({
      message: "Profile updated",
      avatar: finalAvatar,
    });
  } catch (error) {
    console.error("❌ Error updateProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
