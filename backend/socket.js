import { Server } from "socket.io";
import pool from "./config/db.js";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  let onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join", (user) => {
      onlineUsers.set(socket.id, user);
      console.log(`👤 ${user.username} joined the chat`);
      printOnlineUsers();
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });

    // ketika user kirim pesan teks
    socket.on("sendMessage", async (data) => {
      try {
        const { sender_id, receiver_id, message } = data;
        console.log("📩 BODY:", data);
        console.log("💾 Menyimpan pesan ke database...");

        const query = `
          INSERT INTO messages (sender_id, receiver_id, message, created_at)
          VALUES ($1, $2, $3, NOW())
          RETURNING *;
        `;
        const values = [sender_id, receiver_id, message];
        const result = await pool.query(query, values);
        const savedMessage = result.rows[0];

        // kirim ke semua client (biar muncul realtime)
        io.emit("newMessage", savedMessage);
      } catch (error) {
        console.error("❌ Error saving message:", error.message);
      }
    });

    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        console.log(`🔴 ${user.username} disconnected`);
        onlineUsers.delete(socket.id);
        printOnlineUsers();
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
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
