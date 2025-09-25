// config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(() => console.log("✅ Connected to Neon PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error", err));

export default pool;
