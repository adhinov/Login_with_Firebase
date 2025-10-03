// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ load .env duluan

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import "./config/db.js"; // ✅ koneksi database

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());

// ==================== CORS CONFIG ====================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // kalau request tanpa origin (misalnya curl / postman) → izinkan
      if (!origin || allowedOrigins.includes(origin)) {
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

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running...",
    allowedOrigins,
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
});
