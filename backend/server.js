// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ load .env duluan

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import "./config/db.js"; // ✅ koneksi database

const app = express();

// ==================== CORS CONFIG ====================
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000", // Next.js default
  "http://localhost:9002", // custom port kamu
  "https://login-app-64w3.vercel.app", // ✅ domain vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
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

app.use(express.json());

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running..." });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
});
