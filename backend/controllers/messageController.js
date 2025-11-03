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

    // Pastikan field dari frontend (atau Postman) benar
    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Sender dan Receiver wajib diisi.",
      });
    }

    let fileUrl = null;

    // Upload file ke Cloudinary (jika ada)
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "chat_uploads",
      });
      fileUrl = result.secure_url;

      // Hapus file lokal setelah diupload ke Cloudinary
      fs.unlinkSync(file.path);
    }

    // Simpan pesan ke database
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message, file_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [sender_id, receiver_id, message || null, fileUrl || null];
    const { rows } = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Pesan berhasil dikirim",
      data: rows[0],
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal upload file atau simpan pesan",
      error: error.message,
    });
  }
};
