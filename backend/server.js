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
  "https://login-with-firebase-sandy.vercel.app", // vercel frontend kamu
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

// --- Menyimpan data user yang online ---
let onlineUsers = {}; // key: socket.id, value: username

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Saat user join
  socket.on("join", (user) => {
    if (user?.username) {
      onlineUsers[socket.id] = user.username;
      console.log(`👋 ${user.username} joined`);

      // Broadcast pesan ke semua user bahwa user baru bergabung
      io.emit("receiveMessage", {
        sender: "System",
        message: `${user.username} joined the chat`,
        createdAt: new Date().toISOString(),
      });

      // Update jumlah user online
      io.emit("onlineUsers", Object.keys(onlineUsers).length);
    }
  });

  // Saat user mengirim pesan
  socket.on("sendMessage", (msg) => {
    if (!msg || !msg.sender || !msg.message) return;

    const fullMessage = {
      sender: msg.sender,
      message: msg.message,
      createdAt: new Date().toISOString(),
    };

    // Broadcast ke semua user (termasuk pengirim)
    io.emit("receiveMessage", fullMessage);
  });

  // Saat user disconnect
  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    console.log("🔴 Disconnected:", username || socket.id);

    // Broadcast info user keluar
    if (username) {
      io.emit("receiveMessage", {
        sender: "System",
        message: `${username} left the chat`,
        createdAt: new Date().toISOString(),
      });
    }

    // Update jumlah online users
    io.emit("onlineUsers", Object.keys(onlineUsers).length);
  });
});

// --- Jalankan server ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
