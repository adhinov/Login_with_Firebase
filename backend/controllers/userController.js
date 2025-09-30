// controllers/userController.js
import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         u.id, 
         u.email, 
         COALESCE(u.username, '') AS username,
         r.name AS role, 
         u.created_at, 
         COALESCE(u.phone_number, '') AS phone_number,
         u.last_login
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.id ASC`
    );

    // ⚡ balikin langsung array, bukan {users: result.rows}
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error getAllUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil data users" });
  }
};
