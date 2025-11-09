"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Message {
  id: number;
  sender_email: string;
  message: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // auto refresh tiap 2 detik
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Gagal ambil pesan:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/upload`,
        { message: input },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInput("");
      fetchMessages();
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d1117] text-white">
      <div className="w-[500px] bg-[#161b22] rounded-xl shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#1f6feb] text-lg font-semibold">💬 Global Chat Room</div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-lg ${
                msg.sender_email === localStorage.getItem("email")
                  ? "bg-[#238636] text-right ml-auto max-w-[75%]"
                  : "bg-[#30363d] text-left mr-auto max-w-[75%]"
              }`}
            >
              <div className="text-xs opacity-70">{msg.sender_email}</div>
              <div>{msg.message}</div>
              {msg.file_url && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sm text-blue-400"
                >
                  📎 File
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-[#161b22] flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 rounded-lg bg-[#0d1117] border border-gray-600 focus:outline-none"
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-[#1f6feb] rounded-lg hover:bg-[#388bfd]"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
