// controllers/adminController.js
import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, role, created_at FROM users"
    );

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data semua user",
      users: rows,
    });
  } catch (error) {
    console.error("❌ Error getAllUsers:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
    });
  }
};
