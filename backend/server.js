// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables lebih awal

import express from "express";
import cors from "cors";
import "./config/db.js"; // ✅ Koneksi database

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());

// ==================== CORS CONFIG ====================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"]; // fallback kalau tidak ada env

app.use(
  cors({
    origin: function (origin, callback) {
      // request tanpa origin (Postman/cURL) → izinkan
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ==================== ROUTES ====================
// Semua auth endpoints → /api/auth/...
app.use("/api/auth", authRoutes);

// Semua user endpoints → /api/users/...
app.use("/api/users", userRoutes);

// Semua admin endpoints → /api/admin/...
app.use("/api/admin", adminRoutes);

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running 🚀",
    environment: process.env.NODE_ENV || "development",
    allowedOrigins,
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      admin: "/api/admin",
    },
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Terjadi kesalahan pada server",
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
  console.log("✅ Available endpoints: /api/auth, /api/users, /api/admin");
});
