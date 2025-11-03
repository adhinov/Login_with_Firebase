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

    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;

    if (!sender_id || !receiver_id) {
      console.log("❌ Sender atau Receiver kosong");
      return res.status(400).json({
        success: false,
        message: "Sender dan Receiver wajib diisi.",
      });
    }

    let fileUrl = null;

    if (file) {
      console.log("☁️ Mengupload ke Cloudinary...");
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "chat_uploads",
      });
      console.log("✅ Cloudinary success:", result.secure_url);
      fileUrl = result.secure_url;
    } else {
      console.log("⚠️ Tidak ada file dikirim");
    }

    console.log("💾 Menyimpan pesan ke database...");
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message, file_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [sender_id, receiver_id, message || null, fileUrl || null];
    const { rows } = await pool.query(query, values);

    console.log("✅ Pesan tersimpan:", rows[0]);

    res.status(201).json({
      success: true,
      message: "Pesan dengan file berhasil dikirim",
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

