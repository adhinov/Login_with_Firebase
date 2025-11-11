import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ========================
// Konfigurasi Multer
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
  limits: { fileSize: 10 * 1024 * 1024 }, // maksimal 10MB
});

// ========================
// Kirim Pesan + File (Global Chat)
// ========================
export const uploadMessageFile = async (req, res) => {
  try {
    const sender_id = req.user?.id;
    const { message } = req.body;

    if (!sender_id) {
      return res
        .status(400)
        .json({ success: false, message: "User belum login." });
    }

    let file_url = null;
    let file_type = null;

    // upload ke Cloudinary jika ada file
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat_uploads",
      });
      file_url = result.secure_url;
      file_type = req.file.mimetype;
      fs.unlinkSync(req.file.path); // hapus file lokal
    }

    const query = `
      INSERT INTO messages (sender_id, message, file_url, file_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const values = [sender_id, message || "", file_url, file_type];
    const { rows } = await pool.query(query, values);

    // kirim balik pesan baru
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ success: false, message: "Gagal kirim pesan." });
  }
};

// ========================
// Ambil Semua Pesan (Global Chat)
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
    res
      .status(500)
      .json({ success: false, message: "Gagal ambil pesan dari server." });
  }
};
