import { Server } from "socket.io";
import pool from "./config/db.js";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "https://login-app-lovat-one.vercel.app", // frontend di Vercel
        "http://localhost:5173", // untuk dev lokal
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000, // jaga koneksi tetap aktif
    pingTimeout: 60000, // jangan putus cepat
  });

  // daftar user yang online
  let onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // user bergabung
    socket.on("join", (user) => {
      onlineUsers.set(socket.id, user);
      console.log(`👤 ${user.username} joined (total: ${onlineUsers.size})`);
      printOnlineUsers();
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });

    // kirim pesan teks
    socket.on("sendMessage", async (data) => {
      try {
        const { sender_id, receiver_id, message } = data;
        console.log("📩 Incoming:", data);

        // simpan ke database
        const query = `
          INSERT INTO messages (sender_id, receiver_id, message, created_at)
          VALUES (?, ?, ?, NOW())
        `;
        const [result] = await pool.query(query, [
          sender_id,
          receiver_id,
          message,
        ]);

        const savedMessage = {
          id: result.insertId,
          sender_id,
          receiver_id,
          message,
          created_at: new Date(),
        };

        // broadcast ke semua user
        io.emit("newMessage", savedMessage);
      } catch (error) {
        console.error("❌ Error saving message:", error.message);
      }
    });

    // user disconnect
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        console.log(`🔴 ${user.username} disconnected`);
        onlineUsers.delete(socket.id);
        printOnlineUsers();
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
      } else {
        console.log("🔴 Unknown user disconnected:", socket.id);
      }
    });
  });

  function printOnlineUsers() {
    console.log("🧑‍🤝‍🧑 Total online:", onlineUsers.size);
    let i = 1;
    for (let [id, user] of onlineUsers) {
      console.log(`  ${i++}. ${user.username} (ID: ${user.id})`);
    }
    console.log("-----------------------------------");
  }

  console.log("✅ Socket.io chat server aktif 🎯");
  return io;
}
