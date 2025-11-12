import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// --- ✅ Konfigurasi CORS ---
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://login-with-firebase-sandy.vercel.app", // frontend Vercel kamu sekarang
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Setup HTTP Server ---
const server = http.createServer(app);

// --- Setup Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"], // fallback otomatis
  pingTimeout: 60000,
  pingInterval: 25000,
});

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);
  onlineUsers++;
  io.emit("onlineUsers", onlineUsers);

  socket.on("join", (user) => {
    console.log(`👋 ${user.username} joined the chat`);
    socket.broadcast.emit("receiveMessage", {
      sender: "System",
      message: `${user.username} joined the chat`,
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("sendMessage", (msg) => {
    console.log("💬 Message received:", msg);
    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", (reason) => {
    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);
    console.warn("🔴 Socket disconnected:", socket.id, reason);
  });

  // Debug stabilitas ping/pong
  socket.conn.on("packet", (packet) => {
    if (packet.type === "ping") console.log("📡 Ping from", socket.id);
  });
  socket.conn.on("packetCreate", (packet) => {
    if (packet.type === "pong") console.log("📡 Pong to", socket.id);
  });
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send("🚀 Chat backend is running fine with CORS fixed!");
});

// --- Jalankan server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
