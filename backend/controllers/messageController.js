import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import pool from "../config/db.js";

// Konfigurasi storage untuk Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

const upload = multer({ storage });

// Upload file + simpan pesan ke database
export const uploadMessageFile = async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;

    // Validasi input
    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "sender_id dan receiver_id wajib dikirim.",
      });
    }

    // Jika tidak ada file, pastikan fileUrl dan fileType = null
    const file = req.file || {};
    const fileUrl = file.path || null;
    const fileType = file.mimetype || null;

    // Simpan pesan ke database
    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, message || "", fileUrl, fileType]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan pesan ke database.",
      });
    }

    // Berhasil
    res.status(200).json({
      success: true,
      message: "Pesan berhasil dikirim.",
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
      message: "Gagal mengirim pesan.",
      error: err.message,
    });
  }
};

// Ekspor middleware upload agar bisa dipakai di routes
export { upload };
