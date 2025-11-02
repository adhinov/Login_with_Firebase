// controllers/messageController.js
import pool from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Lokasi folder upload
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Controller upload
export const uploadFile = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diupload" });

      const { sender_id, receiver_id, message } = req.body;
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      const fileType = req.file.mimetype;

      // Simpan metadata ke database
      await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [sender_id, receiver_id || null, message || "", fileUrl, fileType]
      );

      res.json({
        success: true,
        file_url: fileUrl,
        file_type: fileType,
      });
    } catch (err) {
      console.error("❌ Error saat upload file:", err.message);
      res.status(500).json({ error: "Gagal upload file" });
    }
  },
];
