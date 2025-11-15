// controllers/messageController.js
import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ========================
// Konfigurasi Multer (SIMPAN SEMENTARA DI /uploads)
// ========================
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
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
});

// ========================
// UPLOAD FILE + SAVE MESSAGE
// ========================
export const uploadMessageFile = async (req, res) => {
  try {
    const sender_id = req.user?.id;
    const sender_email = req.user?.email;
    const sender_name = req.user?.username;
    const { message } = req.body;

    if (!sender_id) {
      return res.status(400).json({
        success: false,
        message: "User belum login.",
      });
    }

    let file_url = null;
    let file_type = null;

    // UPLOAD FILE
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_uploads",
        resource_type: "auto",
      });

      file_url = result.secure_url;
      file_type = req.file.mimetype;

      fs.unlinkSync(req.file.path);
    }

    // SIMPAN DB
    const query = `
      INSERT INTO messages 
      (sender_id, message, file_url, file_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;

    const values = [sender_id, message || "", file_url, file_type];
    const { rows } = await pool.query(query, values);
    const saved = rows[0];

    const fullMessage = {
      ...saved,
      sender_email,
      sender_name,
    };

    // 💥 BROADCAST REALTIME KE SEMUA USER (SOLUSI UTAMA)
    const io = req.app.get("io");
    if (io) {
      io.emit("receiveMessage", fullMessage);
    }

    // RETURN KE PENGUPLOAD
    return res.status(201).json(fullMessage);
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengirim pesan.",
    });
  }
};

// ========================
// GET ALL MESSAGES
// ========================
export const getAllMessages = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.sender_id,
        m.message,
        m.file_url,
        m.file_type,
        m.created_at,
        u.username AS sender_name,
        u.email AS sender_email
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at ASC;
    `;

    const { rows } = await pool.query(query);

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error ambil pesan:", error);
    res.status(500).json({
      success: false,
      message: "Gagal ambil data pesan.",
    });
  }
};
