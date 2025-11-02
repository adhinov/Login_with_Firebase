import pool from "../config/db.js";

/**
 * Simpan pesan ke database (bisa teks atau dengan file)
 * POST /api/messages/send
 */
export const saveMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, message, file_url } = req.body;

    if (!sender_id || (!message && !file_url)) {
      return res.status(400).json({ error: "Pesan atau file tidak boleh kosong" });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, file_url, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [sender_id, receiver_id || null, message || null, file_url || null]
    );

    res.status(201).json({
      success: true,
      message: "Pesan berhasil disimpan",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error saving message:", err.message);
    res.status(500).json({ error: "Gagal menyimpan pesan" });
  }
};
