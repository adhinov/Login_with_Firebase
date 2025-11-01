// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "./config/db.js";
import pool from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const server = http.createServer(app);

// ==================== CORS CONFIG ====================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["*"];

app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
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

// ==================== SOCKET.IO SETUP ====================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map(); // userId -> socket.id

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // user join
  socket.on("join", ({ userId, username }) => {
    onlineUsers.set(userId, socket.id);
    socket.userData = { userId, username };
    console.log(`✅ ${username} (${userId}) joined as ${socket.id}`);
  });

  // kirim pesan
  socket.on("sendMessage", async (msg) => {
    try {
      const { sender_id, receiver_id, message, created_at, sender_name } = msg;

      // Simpan ke DB (boleh kosongkan receiver_id jika chat room global)
      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, $4)",
        [sender_id, receiver_id, message, created_at]
      );

      // ✅ Chat Room Mode (receiver_id null)
      if (!receiver_id) {
        // kirim ke semua user yang terhubung
        io.emit("receiveMessage", msg);
        console.log(`💬 [Room] ${sender_name}: ${message}`);
      } else {
        // ✅ Private chat mode
        const receiverSocketId = onlineUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", msg);
        }
        io.to(socket.id).emit("receiveMessage", msg);
        console.log(`💬 [Private] ${sender_name} → ${receiver_id}: ${message}`);
      }
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ambil semua pesan (global chat)
app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT m.*, u.username AS sender_name FROM messages m JOIN users u ON m.sender_id = u.id ORDER BY m.created_at ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Gagal mengambil pesan" });
  }
});

// ambil riwayat private chat
app.get("/api/chat/history/:a/:b", async (req, res) => {
  const { a, b } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.*, u.username AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [a, b]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({ error: "Gagal mengambil riwayat pesan" });
  }
});

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    status: "✅ OK",
    message: "Backend aktif dengan Socket.io 🚀",
    socket_status: io ? "aktif" : "tidak aktif",
    endpoints: ["/api/auth", "/api/users", "/api/admin", "/api/chat/history/:a/:b"],
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Socket.io chat server aktif 🎯");
});
