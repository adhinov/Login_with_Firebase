// controllers/userController.js
import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   📌 Konversi tanggal ke UTC+7 (Jakarta)
   ============================================================ */
export const toJakartaISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const jkt = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return jkt.toISOString();
};

/* ============================================================
   📌 DEFAULT AVATAR
   ============================================================ */
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/ddoqewccs/image/upload/v1733640000/login-app/avatars/default.svg";

export const safeAvatar = (url) => {
  if (!url) return DEFAULT_AVATAR;
  return url;
};

/* ============================================================
   🔹 GET ALL USERS
   ============================================================ */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, avatar FROM users ORDER BY id ASC"
    );

    const users = result.rows.map((u) => ({
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
   🔹 GET CHAT USERS
   ============================================================ */
export const getChatUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, avatar FROM users ORDER BY id ASC"
    );

    const users = result.rows.map((u) => ({
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
   🔥 UPDATE PROFILE + UPLOAD AVATAR (CLOUDINARY)
   ============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone } = req.body;

    console.log("\n==============================");
    console.log("📥 UPDATE PROFILE REQUEST");
    console.log("==============================");
    console.log("➡ userId:", userId);
    console.log("➡ body:", req.body);
    console.log("➡ file:", req.file);

    // Ambil data lama
    const oldRes = await pool.query(
      "SELECT avatar FROM users WHERE id = $1",
      [userId]
    );

    if (oldRes.rows.length === 0) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const oldAvatar = oldRes.rows[0].avatar;
    console.log("🖼 Old avatar:", oldAvatar);

    let newAvatarURL = oldAvatar || DEFAULT_AVATAR;

    /* ============================================================
       🚀 UPLOAD AVATAR BARU KE CLOUDINARY
       ============================================================ */
    if (req.file) {
      console.log("📤 Uploading NEW avatar to Cloudinary...");

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "login-app/avatars",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      });

      newAvatarURL = uploadResult.secure_url;

      console.log("✅ UPLOAD SUCCESS:");
      console.log(uploadResult);

      /* ============================================================
         🚮 HAPUS AVATAR LAMA
         ============================================================ */
      if (oldAvatar && oldAvatar !== DEFAULT_AVATAR) {
        console.log("\n🗑 Deleting OLD avatar:", oldAvatar);

        try {
          // Extract publicId
          const split = oldAvatar.split("/upload/");
          const afterUpload = split[1]; // "v123/login-app/avatars/xxx"
          const publicId = afterUpload.split(".")[0];

          console.log("🆔 Extracted publicId:", publicId);

          await cloudinary.uploader.destroy(publicId);

          console.log("✅ OLD AVATAR DELETED");
        } catch (err) {
          console.log("⚠️ Failed to delete old avatar:", err.message);
        }
      }
    }

    /* ============================================================
       💾 UPDATE DATABASE
       ============================================================ */
    console.log("\n💾 Updating user in database...");

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
      newAvatarURL,
      userId,
    ]);

    const updated = rows[0];

    console.log("✅ DATABASE UPDATED:");
    console.log(updated);

    return res.json({
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
