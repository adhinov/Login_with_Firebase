// src/lib/socket.ts
import socketIOClient from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://login-app-production-7f54.up.railway.app";

// pakai as any agar TS tidak rewel terhadap properti 'extraHeaders'
const socket = socketIOClient(SOCKET_URL, {
  transports: ["websocket", "polling"],
  extraHeaders: {}, // aman secara runtime
} as any);

socket.on("connect", () => {
  console.log("✅ Connected to socket server:", SOCKET_URL);
});

socket.on("connect_error", (err: any) => {
  console.error("❌ Socket connection error:", err);
});

socket.on("disconnect", (reason: any) => {
  console.warn("⚠️ Disconnected:", reason);
});

export default socket;
