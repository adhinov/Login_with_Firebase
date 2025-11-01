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

const onlineUsers = new Map(); // userId -> { socketId, username }

// 🧾 Helper untuk menampilkan daftar user online
function printOnlineUsers() {
  const users = Array.from(onlineUsers.entries());
  console.log(`\n🧑‍🤝‍🧑 Total online: ${users.length}`);
  users.forEach(([id, data], index) => {
    console.log(`  ${index + 1}. ${data.username} (ID: ${id})`);
  });
  console.log("-----------------------------------\n");
}

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // user join event
  socket.on("join", ({ userId, username }) => {
    onlineUsers.set(userId, { socketId: socket.id, username });
    socket.userData = { userId, username };
    console.log(`👤 ${username} joined the chat`);
    printOnlineUsers();
  });

  // kirim pesan
  socket.on("sendMessage", async (msg) => {
    try {
      const { sender_id, receiver_id, message, created_at, sender_name } = msg;

      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, $4)",
        [sender_id, receiver_id, message, created_at]
      );

      if (!receiver_id) {
        // broadcast ke semua user (chat room)
        io.emit("receiveMessage", msg);
        console.log(`💬 Message from ${sender_name}: ${message}`);
      } else {
        // private message
        const receiverData = onlineUsers.get(receiver_id);
        if (receiverData) {
          io.to(receiverData.socketId).emit("receiveMessage", msg);
        }
        io.to(socket.id).emit("receiveMessage", msg);
        console.log(`💬 Private message from ${sender_name} → ${receiver_id}: ${message}`);
      }
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  // handle disconnect
  socket.on("disconnect", () => {
    let disconnectedUser = null;
    for (let [userId, data] of onlineUsers.entries()) {
      if (data.socketId === socket.id) {
        disconnectedUser = { id: userId, username: data.username };
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      console.log(`🔴 ${disconnectedUser.username} disconnected`);
      printOnlineUsers();
    } else {
      console.log(`🔴 Unknown socket disconnected: ${socket.id}`);
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
