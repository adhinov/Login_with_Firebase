"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface Message {
  sender: string;
  text: string;
  createdAt?: string;
}

export default function Chat() {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 🔧 Pastikan URL backend sesuai dengan Railway kamu
    const s = io("https://login-app-production-7f54.up.railway.app", {
      transports: ["websocket"],
      withCredentials: true,
    } as any);

    setSocket(s);

    s.on("connect", () => {
      console.log("✅ socket connected:", s.id);
      setConnected(true);
    });

    s.on("disconnect", (reason: any) => {
      console.warn("⚠️ socket disconnected:", reason);
      setConnected(false);
    });

    s.on("receive_message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    const newMessage: Message = { sender: "You", text: input };
    socket.emit("send_message", newMessage);
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="p-4 max-w-lg mx-auto border rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-center">
        {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </h2>

      <div className="h-80 overflow-y-auto border p-2 mb-3 bg-gray-50 rounded">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 my-1 rounded ${
              msg.sender === "You"
                ? "bg-blue-200 text-right"
                : "bg-gray-200 text-left"
            }`}
          >
            <strong>{msg.sender}: </strong>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border rounded-l p-2"
          placeholder="Ketik pesan..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
