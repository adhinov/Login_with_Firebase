// models/userModel.js
import pool from "../config/db.js";

// ================== FIND USER BY EMAIL ==================
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
};

// ================== FIND USER BY ID ==================
export const findUserById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] || null;
};

// ================== CREATE USER ==================
export const createUser = async (
  email,
  hashedPassword,
  username,
  phone_number = null,
  role_id = 2 // default role = user
) => {
  const result = await pool.query(
    `INSERT INTO users (email, password, username, phone_number, role_id, created_at) 
     VALUES ($1, $2, $3, $4, $5, NOW()) 
     RETURNING id, email, username, phone_number, role_id, created_at, last_login`,
    [email, hashedPassword, username, phone_number, role_id]
  );
  return result.rows[0];
};

// ================== UPDATE LAST LOGIN ==================
export const updateLastLogin = async (id) => {
  const result = await pool.query(
    "UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING id, last_login",
    [id]
  );
  return result.rows[0];
};

// ================== GET ALL USERS ==================
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, email, username, role_id, phone_number, created_at, last_login 
     FROM users ORDER BY id ASC`
  );
  return result.rows;
};
