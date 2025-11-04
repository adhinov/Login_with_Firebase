import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ===== Konfigurasi multer =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // maks 10MB
});

// ===== Controller: Upload Pesan + File =====
export const uploadMessageFile = async (req, res) => {
  try {
    console.log("📩 BODY:", req.body);
    console.log("📎 FILE:", req.file);

    const sender_id = req.user?.id; // ✅ ambil dari token
    const { receiver_id, message } = req.body;

    if (!sender_id || !receiver_id) {
      console.log("❌ Sender atau Receiver kosong");
      return res.status(400).json({
        success: false,
        message: "Sender dan Receiver wajib diisi.",
      });
    }

    let file_url = null;
    let file_type = null;

    if (req.file) {
      console.log("☁️ Mengupload ke Cloudinary...");
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_uploads",
      });
      file_url = result.secure_url;
      file_type = req.file.mimetype;
      console.log("✅ Cloudinary success:", file_url);
    }

    console.log("💾 Menyimpan pesan ke database...");
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [sender_id, receiver_id, message || "", file_url, file_type];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Pesan dengan file berhasil dikirim",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengirim pesan",
      error: error.message,
    });
  }
};

// Ambil semua pesan antara dua user (chat history)
export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const query = `
      SELECT *
      FROM messages
      WHERE 
        (sender_id = $1 AND receiver_id = $2)
        OR 
        (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC;
    `;

    const { rows } = await pool.query(query, [senderId, receiverId]);

    res.status(200).json({
      success: true,
      message: "Daftar pesan berhasil diambil",
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error ambil pesan:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil pesan",
      error: error.message,
    });
  }
};


