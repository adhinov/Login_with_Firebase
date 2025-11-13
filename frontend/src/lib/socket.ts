// src/lib/socket.ts
import socketIOClient from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://login-app-production-7f54.up.railway.app";

const socket = socketIOClient(
  SOCKET_URL,
  {
    transports: ["websocket"], // stabilkan ke websocket
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
  } as any
);

// safe typed callbacks
socket.on("connect", () => {
  console.log("✅ Connected to socket server:", SOCKET_URL);
});

socket.on("connect_error", (err: any) => {
  console.error("❌ Socket connection error:", err?.message ?? err);
});

// reason bisa undefined, beri tipe eksplisit supaya TS tidak complain
socket.on("disconnect", (reason?: string) => {
  console.warn("⚠️ Socket disconnected:", reason);
});

export default socket;
