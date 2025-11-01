"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface Message {
  sender_id: number;
  receiver_id: number | null;
  sender_name?: string;
  message: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("User");

  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Ambil user dari localStorage
    const user =
      typeof window !== "undefined"
        ? localStorage.getItem("user")
        : null;

    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.id) setUserId(parsed.id);
        if (parsed?.username) setUsername(parsed.username);
      } catch {
        console.warn("Failed to parse user from localStorage");
      }
    }

    // Inisialisasi socket
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Connected:", socket.id);
      setConnected(true);

      if (userId) {
        socket.emit("join", { userId, username });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected");
      setConnected(false);
    });

    socket.on("receiveMessage", (data: Message) => {
      console.log("📩 New message:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [API_URL, userId, username]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !userId) return;

    const messageData: Message = {
      sender_id: userId,
      receiver_id: null,
      sender_name: username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    console.log("✉️ Sending:", messageData);
    socketRef.current.emit("sendMessage", messageData);
    setInput(""); // ✅ tidak perlu setMessages di sini
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white relative">
      {/* Tombol Logout */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>

      <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4 flex justify-center items-center gap-2">
          💬 Chat Room{" "}
          <span className={connected ? "text-lime-400" : "text-red-400"}>
            {connected ? "🟢" : "🔴"}
          </span>
        </h1>

        <div className="h-96 overflow-y-auto border border-slate-700 rounded-lg p-3 mb-4 bg-slate-900">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">Belum ada pesan.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender_name === username
                    ? "text-right"
                    : "text-left"
                }`}
              >
                <p className="text-sm text-lime-300 font-semibold">
                  {msg.sender_name || `User ${msg.sender_id}`}
                </p>
                <p className="text-white bg-slate-700 inline-block rounded-lg px-3 py-1">
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 p-2 rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-lime-400 text-black px-4 py-2 rounded-lg hover:bg-lime-500 transition"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
