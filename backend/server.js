// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ load .env duluan sebelum file lain

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import "./config/db.js"; // ✅ koneksi database otomatis

const app = express();

// Debug: cek env variables
console.log("📦 Loaded from .env:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
