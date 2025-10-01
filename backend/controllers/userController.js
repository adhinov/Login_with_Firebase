// controllers/userController.js
import pool from "../config/db.js";

/**
 * Helper untuk konversi tanggal ke UTC+7 dalam format ISO string
 */
const toJakartaISO = (date) => {
  if (!date) return null;

  // Pastikan input berupa Date object
  const d = new Date(date);

  // Tambahkan offset 7 jam (UTC+7)
  const jakartaTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);

  return jakartaTime.toISOString(); // tetap format ISO
};

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

    // Konversi kolom tanggal ke UTC+7
    const users = result.rows.map((u) => ({
      ...u,
      created_at: toJakartaISO(u.created_at),
      last_login: toJakartaISO(u.last_login),
    }));

    res.json(users); // ⚡ tetap array langsung
  } catch (error) {
    console.error("❌ Error getAllUsers:", error.message);
    res.status(500).json({ message: "Gagal mengambil data users" });
  }
};
