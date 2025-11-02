import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "../middleware/verifyToken.js";
import pool from "../config/db.js"; // sesuaikan path koneksi DB kamu

const router = express.Router();

// 🔧 Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔧 Konfigurasi Multer (gunakan buffer, bukan simpan lokal)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============================
// 📩 ROUTE: Kirim pesan baru
// ============================
router.post("/send", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    let file_url = null;
    let file_type = null;

    // Jika user upload file → upload ke Cloudinary
    if (req.file) {
      const uploadedFile = await cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "chat_uploads",
        },
        async (error, result) => {
          if (error) {
            console.error("❌ Upload Cloudinary error:", error);
            return res
              .status(500)
              .json({ success: false, message: "Gagal upload file" });
          }

          file_url = result.secure_url;
          file_type = result.resource_type;

          // Simpan pesan ke database
          const [rows] = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [sender_id, receiver_id, message || null, file_url, file_type]
          );

          return res.status(200).json({
            success: true,
            message: "Pesan berhasil dikirim",
            data: {
              id: rows.insertId,
              sender_id,
              receiver_id,
              message,
              file_url,
              file_type,
            },
          });
        }
      );

      // tulis stream data agar Cloudinary bisa baca buffer
      uploadedFile.end(req.file.buffer);
    } else {
      // Jika tanpa file
      const [rows] = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, created_at)
         VALUES (?, ?, ?, NOW())`,
        [sender_id, receiver_id, message || null]
      );

      return res.status(200).json({
        success: true,
        message: "Pesan teks berhasil dikirim",
        data: { id: rows.insertId, sender_id, receiver_id, message },
      });
    }
  } catch (error) {
    console.error("❌ Error di /send:", error);
    res.status(500).json({ success: false, message: "Gagal mengirim pesan" });
  }
});

// ============================
// 📬 ROUTE: Ambil riwayat pesan
// ============================
router.get("/history/:sender_id/:receiver_id", verifyToken, async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      messages: rows,
    });
  } catch (error) {
    console.error("❌ Error di /history:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil pesan" });
  }
});

export default router;
