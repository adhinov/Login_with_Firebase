import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import pool from "../config/db.js";

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

const upload = multer({ storage });

// Controller upload file + simpan ke DB
export const uploadMessageFile = async (req, res) => {
  try {
    // --- ambil data dari form ---
    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;

    // --- validasi dasar ---
    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "sender_id dan receiver_id wajib diisi",
      });
    }

    // --- jika ada file ---
    const fileUrl = file?.path || null;
    const fileType = file?.mimetype || null;

    // --- simpan ke DB ---
    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, message || null, fileUrl, fileType]
    );

    res.status(200).json({
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

export { upload };
