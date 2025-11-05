// ==================================================
// 🌍 Environment & Imports
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
// 🛠 CORS setup
// ==================================================
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["https://login-with-firebase-sandy.vercel.app", "http://localhost:5173"];

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

// ==================================================
// 📦 Body Parser — skip multipart/form-data
// ==================================================
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.json({ limit: "10mb" })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==================================================
// ☁️ Cloudinary Config
// ==================================================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================================================
// 🧩 Upload file setup
// ==================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// ==================================================
// 📤 Local upload endpoint (optional debugging)
// ==================================================
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    console.log(`📤 File uploaded locally: ${fileUrl}`);
    res.json({ url: fileUrl });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: "Gagal upload file" });
  }
});
app.use("/uploads", express.static(uploadDir));

// ==================================================
// 📦 Routes
// ==================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

// ==================================================
// ⚡ Socket.io Setup (optimized for Render/Vercel)
// ==================================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"], // ⬅️ Hindari long-polling (fix HTTP2 issues)
});

const onlineUsers = new Map();

function printOnlineUsers() {
  const users = Array.from(onlineUsers.entries());
  console.log(`\n🧑‍🤝‍🧑 Total online: ${users.length}`);
  users.forEach(([id, data], i) =>
    console.log(`  ${i + 1}. ${data.username} (ID: ${id})`)
  );
  console.log("-----------------------------------\n");
}

function broadcastOnlineUsers() {
  const users = Array.from(onlineUsers.values()).map((u) => ({
    username: u.username,
    socketId: u.socketId,
  }));
  io.emit("updateOnlineUsers", users);
}

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ============ User Join ============
  socket.on("join", ({ userId, username }) => {
    onlineUsers.set(userId, { socketId: socket.id, username });
    socket.userData = { userId, username };
    console.log(`👤 ${username} joined the chat`);
    printOnlineUsers();
    broadcastOnlineUsers();
  });

  // ============ Kirim Pesan ============
  socket.on("sendMessage", async (msg) => {
    try {
      const {
        sender_id,
        receiver_id,
        message,
        created_at,
        file_url,
        file_type,
      } = msg;

      console.log("📩 BODY:", msg);

      await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, created_at, file_url, file_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sender_id, receiver_id, message, created_at, file_url || null, file_type || null]
      );

      // kirim ke penerima dan pengirim
      const receiverData = onlineUsers.get(receiver_id);
      if (receiverData) {
        io.to(receiverData.socketId).emit("receiveMessage", msg);
      }
      io.to(socket.id).emit("receiveMessage", msg);

      console.log(`💬 Pesan tersimpan dari ${sender_id} → ${receiver_id}`);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  // ============ Disconnect ============
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
      broadcastOnlineUsers();
    } else {
      console.log(`🔴 Unknown socket disconnected: ${socket.id}`);
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
