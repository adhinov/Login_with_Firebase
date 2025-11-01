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
    console.log(`✅ ${username} (${userId}) joined as ${socket.id}`);
  });

  // kirim pesan
  socket.on("sendMessage", async (msg) => {
    try {
      const { sender_id, receiver_id, message, created_at } = msg;

      // simpan pesan ke DB
      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, $4)",
        [sender_id, receiver_id, message, created_at]
      );

      // kirim ke penerima jika online
      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", msg);
      }

      // tampilkan juga ke pengirim
      io.to(socket.id).emit("receiveMessage", msg);
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
