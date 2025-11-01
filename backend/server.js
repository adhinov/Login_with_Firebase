// ===== server.js =====
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Konfigurasi Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // pastikan origin kamu di sini (misal vercel frontend)
    methods: ["GET", "POST"],
  },
});

// 🔥 Simpan daftar user online di memori
let onlineUsers = {}; // key: socket.id, value: { userId, username }

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // Ketika user join room
  socket.on("join", ({ userId, username }) => {
    onlineUsers[socket.id] = { userId, username };
    console.log(`👤 ${username} joined the chat`);
    printOnlineUsers();
  });

  // Ketika user kirim pesan
  socket.on("sendMessage", (data) => {
    console.log(`💬 Message from ${data.sender_name}: ${data.message}`);
    socket.broadcast.emit("receiveMessage", data);
  });

  // Ketika user disconnect
  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id];
    if (user) {
      console.log(`🔴 ${user.username} disconnected`);
      delete onlineUsers[socket.id];
      printOnlineUsers();
    }
  });
});

// Helper function untuk menampilkan jumlah user online
function printOnlineUsers() {
  const users = Object.values(onlineUsers);
  console.log(`\n🧑‍🤝‍🧑 Total online: ${users.length}`);
  users.forEach((u, i) => console.log(`  ${i + 1}. ${u.username} (ID: ${u.userId})`));
  console.log("-----------------------------------\n");
}

// Root route
app.get("/", (req, res) => {
  res.send("Chat server running 🚀");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
