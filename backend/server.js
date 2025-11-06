// ==================================================
// 🌍 Imports & Setup
// ==================================================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cloudinary from "cloudinary";
import pool from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

// ==================================================
// 🛠️ CORS
// ==================================================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["https://login-with-firebase-sandy.vercel.app", "http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ==================================================
// 📦 Body Parser
// ==================================================
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.json({ limit: "10mb" })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==================================================
// ☁️ Cloudinary
// ==================================================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================================================
// 📂 Uploads
// ==================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// ==================================================
// 📦 Routes
// ==================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

// ==================================================
// ⚡ Socket.io
// ==================================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

app.set("io", io);

// Simpan user yang online
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ============ User bergabung ============
  socket.on("join", ({ userId, username }) => {
    if (!userId) return;
    onlineUsers.set(userId, { socketId: socket.id, username });
    socket.join(String(userId)); // gunakan string agar konsisten
    console.log(`👤 ${username} joined (ID: ${userId})`);
    console.log(`🧑‍🤝‍🧑 Total online: ${onlineUsers.size}`);
  });

  // ============ Kirim Pesan ============
  socket.on("sendMessage", async (msg) => {
    const {
      sender_id,
      receiver_id,
      message,
      created_at,
      file_url,
      file_type,
    } = msg;

    if (!sender_id || !receiver_id) {
      console.log("❌ sender_id / receiver_id kosong");
      return;
    }

    console.log("📩 Pesan diterima di server:", msg);

    try {
      // Pastikan sender & receiver ada di tabel users (hindari foreign key error)
      const checkUsers = await pool.query(
        `SELECT id FROM users WHERE id IN ($1, $2)`,
        [sender_id, receiver_id]
      );
      if (checkUsers.rows.length < 2) {
        console.log("⚠️ Salah satu user tidak ditemukan di database");
        return;
      }

      const query = `
        INSERT INTO messages (sender_id, receiver_id, message, created_at, file_url, file_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        sender_id,
        receiver_id,
        message || "",
        created_at || new Date(),
        file_url || null,
        file_type || null,
      ];
      const result = await pool.query(query, values);
      const savedMessage = result.rows[0];

      // Kirim ke penerima jika online
      const receiverData = onlineUsers.get(receiver_id);
      if (receiverData) {
        io.to(receiverData.socketId).emit("receiveMessage", savedMessage);
      }

      // Kirim balik ke pengirim (agar muncul langsung)
      io.to(socket.id).emit("receiveMessage", savedMessage);

      console.log(`💬 Pesan tersimpan dari ${sender_id} → ${receiver_id}`);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  // ============ Disconnect ============
  socket.on("disconnect", () => {
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.socketId === socket.id) {
        console.log(`🔴 ${user.username || "Unknown"} disconnected`);
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// ==================================================
// 🧭 Default route
// ==================================================
app.get("/", (req, res) => {
  res.json({
    status: "✅ OK",
    message: "Backend aktif dengan Socket.io 🚀",
  });
});

// ==================================================
// 🚀 Start Server
// ==================================================
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Socket.io chat server aktif 🎯");
});
