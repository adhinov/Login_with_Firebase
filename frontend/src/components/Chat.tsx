"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  sender: string;
  message: string;
  createdAt?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState<string>("User");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
  // Ambil username dari localStorage (safely)
  const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed?.username) setUsername(parsed.username);
    } catch {
      /* ignore */
    }
  }

  let mounted = true;

  (async () => {
    try {
      const mod = await import("socket.io-client");
      const modAny = mod as any; // <-- CAST DI SINI (penting)

      // kompatibel dengan berbagai ekspor versi socket.io-client
      const ioFn =
        modAny.io ?? // named export (v4+)
        modAny.default ?? // default export
        modAny.connect ?? // older shapes
        modAny; // fallback

      const socket = ioFn(API_URL, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mounted) return;
        console.log("🟢 Connected to socket server:", socket.id);
        setConnected(true);
      });

      socket.on("disconnect", (reason: any) => {
        if (!mounted) return;
        console.log("🔴 Disconnected:", reason);
        setConnected(false);
      });

      socket.on("connect_error", (err: any) => {
        if (!mounted) return;
        console.warn("⚠️ Socket connect_error:", err?.message ?? err);
        setConnected(false);
      });

      socket.on("receiveMessage", (data: Message) => {
        if (!mounted) return;
        setMessages((prev) => [
          ...prev,
          { ...data, createdAt: new Date().toISOString() },
        ]);
      });
    } catch (err: any) {
      console.error("❌ Failed to load socket.io-client or connect:", err?.message ?? err);
    }
  })();

  return () => {
    mounted = false;
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        /* ignore */
      }
      socketRef.current = null;
    }
  };
}, [API_URL]);

  // Fungsi kirim pesan
  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !socketRef.current) return;

    const messageData = {
      sender: username,
      message: msg,
    };

    socketRef.current.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          💬 Chat Room {connected ? "🟢" : "🔴"}
        </h1>

        <div className="h-96 overflow-y-auto border border-slate-700 rounded-lg p-3 mb-4 bg-slate-900">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">Belum ada pesan.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === username ? "text-right" : "text-left"
                }`}
              >
                <p className="text-sm text-lime-300 font-semibold">
                  {msg.sender}
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
