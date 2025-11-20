import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();

/* ============================================================
   🚫 FIX Railway HTTP/2 issues
   ============================================================ */
app.use((req, res, next) => {
  res.setHeader("Connection", "close");
  next();
});

/* ============================================================
   📦 Body Parser
   ============================================================ */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* ============================================================
   🎯 CORS CONFIG — FIX PUT + no-origin requests
   ============================================================ */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://login-with-firebase-sandy.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

/* ============================================================
   🖼 STATIC UPLOADS (FIX 404 Avatar)
   ============================================================ */
const __dirname = process.cwd(); // FIX
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ============================================================
   🔗 ROUTES
   ============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // FIX: update profile
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Chat backend + Auth is running fine!");
});

/* ============================================================
   🔥 SOCKET.IO
   ============================================================ */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// biar controller bisa broadcast upload file
app.set("io", io);

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);
  onlineUsers++;
  io.emit("onlineUsers", onlineUsers);

  socket.on("join", (user) => {
    io.emit("receiveMessage", {
      sender_name: "System",
      message: `${user.username} joined the chat`,
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("sendMessage", (msg) => {
    const fullMessage = {
      id: msg.id || Date.now(),
      sender_id: msg.sender_id || null,
      sender_email: msg.sender_email || null,
      sender_name: msg.sender_name || msg.username || "Unknown",
      message: msg.message || "",
      file_url: msg.file_url || null,
      file_type: msg.file_type || null,
      createdAt: msg.created_at || new Date().toISOString(),
    };

    io.emit("receiveMessage", fullMessage);
  });

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* ============================================================
   🚀 START SERVER
   ============================================================ */

const PORT = process.env.PORT || 8080;
server.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
