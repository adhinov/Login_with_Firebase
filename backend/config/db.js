// config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Buat koneksi pool ke Neon PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Neon butuh SSL
  },
});

// Tes koneksi
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected to Neon PostgreSQL");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

export default pool;
