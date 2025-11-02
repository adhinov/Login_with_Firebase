import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import pool from "../config/db.js"; // sesuaikan dengan config database kamu

// Setup storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

const upload = multer({ storage });

// Upload file ke Cloudinary
export const uploadMessageFile = async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;

    // Dapatkan URL file dari Cloudinary
    const fileUrl = file?.path || null;
    const fileType = file?.mimetype || null;

    // Simpan ke database
    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, message, fileUrl, fileType]
    );

    res.json({
      success: true,
      message: "File uploaded to Cloudinary",
      file_url: fileUrl,
      file_type: fileType,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export middleware upload
export { upload };
