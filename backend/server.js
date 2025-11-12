import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

// 1. Panggil dotenv.config() paling atas agar variabel .env siap
dotenv.config();

// 2. Buat aplikasi Express 'app' SEKARANG
const app = express();

// 3. Buat server HTTP dari 'app' (dibutuhkan oleh Socket.io)
const server = http.createServer(app);

// --- PENGATURAN CORS ---
// (Sekarang aman karena 'app' sudah ada)
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

// 4. Terapkan middleware lain (seperti parser JSON)
app.use(express.json());

// 5. Daftarkan Routes Anda SEKARANG (setelah app dan middleware siap)
// Ini adalah baris yang menyebabkan error, sekarang di posisi yang benar.
app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes); // Jika Anda punya ini, aktifkan di sini

// --- PENGATURAN SOCKET.IO ---
// (Sekarang aman karena 'server' dan 'allowedOrigins' sudah ada)
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

// --- MULAI SERVER ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});