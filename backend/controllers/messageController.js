import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

// Upload file (gambar/dokumen) ke Cloudinary dan simpan ke database
export const uploadMessageFile = async (req, res) => {
  try {
    console.log("📩 BODY:", req.body);
    console.log("📎 FILE:", req.file);

    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Sender dan Receiver wajib diisi.",
      });
    }

    let fileUrl = null;

    if (file) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "chat_uploads",
      });
      fileUrl = result.secure_url;
    }

    const query = `
      INSERT INTO messages (sender_id, receiver_id, message, file_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [sender_id, receiver_id, message || null, fileUrl || null];
    const { rows } = await pool.query(query, values);

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
