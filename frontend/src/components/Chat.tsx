"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface Message {
  sender_id?: string;
  receiver_id?: string;
  message: string;
  created_at?: string;
  file_url?: string | null;
  file_type?: string | null;
}

// socket diketik sebagai any agar kompatibel dengan versi lama
let socket: any;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io("https://login-app-production-7f54.up.railway.app", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);

      // Kirim identitas user (sementara hardcoded)
      socket.emit("join", { userId: "1", username: "User1" });
    });

    socket.on("disconnect", (reason: string) => {
      console.warn("⚠️ Socket disconnected:", reason);
      setConnected(false);
    });

    // Terima pesan
    socket.on("receiveMessage", (data: Message) => {
      console.log("📨 Received:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "") return;

    const newMessage: Message = {
      sender_id: "1",
      receiver_id: "2",
      message: input,
      created_at: new Date().toISOString(),
    };

    socket.emit("sendMessage", newMessage);
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="p-4 max-w-lg mx-auto border rounded-lg bg-white shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </h2>

      <div className="h-80 overflow-y-auto border p-2 mb-3 bg-gray-50 rounded">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 my-1 rounded ${
              msg.sender_id === "1"
                ? "bg-blue-100 text-right"
                : "bg-gray-200 text-left"
            }`}
          >
            <strong>
              {msg.sender_id === "1" ? "You" : `User ${msg.sender_id}`}:
            </strong>{" "}
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border rounded-l p-2 text-black bg-white"
          placeholder="Ketik pesan..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
