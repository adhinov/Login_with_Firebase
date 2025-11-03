import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import pool from "../config/db.js";

// Konfigurasi storage untuk Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "mp3"],
  },
});

const upload = multer({ storage });

// Controller: Upload pesan + file (jika ada)
export const uploadMessageFile = async (req, res) => {
  try {
    console.log("📩 BODY:", req.body);
    console.log("📎 FILE:", req.file);

    const { sender_id, receiver_id, message } = req.body;
    const fileUrl = req.file ? req.file.path : null;
    const fileType = req.file ? req.file.mimetype : null;

    // ✅ Gunakan query yang aman tanpa koma ganda
    let query = "";
    let values = [];

    if (fileUrl && fileType) {
      query = `
        INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      values = [sender_id, receiver_id, message || null, fileUrl, fileType];
    } else {
      query = `
        INSERT INTO messages (sender_id, receiver_id, message, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      values = [sender_id, receiver_id, message || null];
    }

    const [result] = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: "Pesan berhasil dikirim",
      data: {
        id: result.insertId,
        sender_id,
        receiver_id,
        message,
        file_url: fileUrl,
        file_type: fileType,
      },
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengirim pesan",
      error: err.message,
    });
  }
};

// Export multer middleware
export { upload };
