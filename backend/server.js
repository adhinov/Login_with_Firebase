// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables pertama kali

import express from "express";
import cors from "cors";
import "./config/db.js"; // ✅ Koneksi ke PostgreSQL (Neon)

// ==================== IMPORT ROUTES ====================
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());

// ==================== CORS CONFIG ====================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"]; // fallback kalau tidak ada ENV

app.use(
  cors({
    origin: function (origin, callback) {
      // request tanpa origin (mis. Postman) → tetap diizinkan
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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ==================== ROOT / HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    status: "✅ OK",
    message: "Backend is running on Railway + Neon PostgreSQL 🚀",
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
// ⚠️ Gunakan "0.0.0.0" agar Railway bisa mengakses server ini
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
  console.log("✅ Available endpoints: /api/auth, /api/users, /api/admin");
});
