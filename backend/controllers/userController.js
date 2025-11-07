// controllers/userController.js
import pool from "../config/db.js";

/**
 * Helper untuk konversi tanggal ke UTC+7 dalam format ISO string
 */
const toJakartaISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const jakartaTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return jakartaTime.toISOString();
};

/**
 * 🔹 Endpoint: GET /api/users
 * 🔒 Hanya admin yang bisa lihat semua user
 */
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

    const users = result.rows.map((u) => ({
      ...u,
      created_at: toJakartaISO(u.created_at),
      last_login: toJakartaISO(u.last_login),
    }));

    res.json(users);
  } catch (error) {
    console.error("❌ Error getAllUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil data users" });
  }
};

/**
 * 🔹 Endpoint: GET /api/users/chat-users
 * ✅ Untuk semua user login — menampilkan daftar user lain untuk chat
 */
export const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const result = await pool.query(
      `SELECT 
         id, 
         email, 
         COALESCE(username, '') AS username
       FROM users
       WHERE id != ? 
       AND email != 'admin@example.com'
       ORDER BY id ASC`,
      [currentUserId]
    );

    res.json(result[0] || result.rows || []); // handle mysql2/postgres pool
  } catch (error) {
    console.error("❌ Error getChatUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil daftar user untuk chat" });
  }
};
