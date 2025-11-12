import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js"; // tetap gunakan pool PostgreSQL kamu
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

app.use("/api/auth", authRoutes);

const app = express();
const server = http.createServer(app);

// --- CORS SETUP ---
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
    : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// --- Tambahkan route Express kamu di sini ---
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // fallback untuk browser tertentu
});

console.log("⚙️ Socket.io server initialized");

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // User bergabung ke chat
  socket.on("join", ({ userId, username }) => {
    if (!userId) return;
    onlineUsers.set(String(userId), { socketId: socket.id, username });
    console.log(`👤 ${username || userId} joined (total: ${onlineUsers.size})`);
    io.emit("onlineUsers", onlineUsers.size);
  });

  // Kirim pesan (dan simpan ke DB)
  socket.on("sendMessage", async (msg) => {
    try {
      const sender_id = msg.sender_id ?? null;
      const message = msg.message ?? "";
      const created_at = msg.created_at ?? new Date().toISOString();
      const file_url = msg.file_url ?? null;
      const file_type = msg.file_type ?? null;

      const insertQuery = `
        INSERT INTO messages (sender_id, message, file_url, file_type, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, sender_id, message, file_url, file_type, created_at
      `;
      const values = [sender_id, message, file_url, file_type, created_at];
      const res = await pool.query(insertQuery, values);
      const saved = res.rows[0];

      const payload = {
        ...saved,
        sender_name: msg.sender_name || null,
        sender_email: msg.sender_email || null,
      };

      io.emit("receiveMessage", payload);
      console.log("💬 Message broadcasted:", payload.message);
    } catch (err) {
      console.error("❌ sendMessage error:", err.message || err);
    }
  });

  // User keluar / tab ditutup
  socket.on("disconnect", () => {
    for (const [userId, info] of onlineUsers.entries()) {
      if (info.socketId === socket.id) {
        console.log(`🔴 ${info.username || userId} disconnected`);
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("onlineUsers", onlineUsers.size);
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
