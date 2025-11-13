import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// --- Konfigurasi CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://login-with-firebase-sandy.vercel.app", // frontend vercel kamu
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Gunakan routes ---
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// --- Root route ---
app.get("/", (req, res) => {
  res.send("🚀 Chat backend + Auth is running fine!");
});

// --- Setup Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);
  onlineUsers++;
  io.emit("onlineUsers", onlineUsers);

  // --- User join chat ---
  socket.on("join", (user) => {
    if (!user || !user.username) return;
    console.log(`👋 ${user.username} joined`);
    socket.broadcast.emit("receiveMessage", {
      sender: "System",
      message: `${user.username} joined the chat`,
      createdAt: new Date().toISOString(),
    });
  });

  // --- Kirim pesan global ---
  socket.on("sendMessage", (msg) => {
    if (!msg || !msg.sender || !msg.message) return;

    const fullMessage = {
      sender: msg.sender,
      message: msg.message,
      createdAt: new Date().toISOString(),
    };

    console.log("💬 Broadcast message:", fullMessage);
    // Kirim ke semua user (termasuk pengirim)
    io.emit("receiveMessage", fullMessage);
  });

  // --- User disconnect ---
  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// --- Jalankan server ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
