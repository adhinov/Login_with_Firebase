"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Settings } from "lucide-react"; // ✅ pakai icon dari lucide-react (lebih rapi)

interface Message {
  id?: number;
  sender?: string;
  message: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // ambil pesan awal dan polling 3 detik
  useEffect(() => {
    if (!API_URL) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setMessages(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch (err) {
        console.error("Gagal ambil pesan:", err);
      }
    };

    fetchMessages();
    const poll = setInterval(fetchMessages, 3000);
    return () => clearInterval(poll);
  }, [API_URL]);

  // scroll ke bawah otomatis
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!API_URL) {
      alert("API URL belum diset (NEXT_PUBLIC_API_URL).");
      return;
    }

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const payload = {
      message: input.trim(),
      sender: user?.username || "You",
    };

    // update optimistis
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: payload.sender,
        message: payload.message,
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");

    try {
      await axios.post(`${API_URL}/api/messages/upload`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  // actions menu
  const handleEditProfile = () => {
    setShowMenu(false);
    window.location.href = "/edit-profile";
  };
  const handleClearChat = () => {
    setShowMenu(false);
    setMessages([]);
  };
  const handleLogout = () => {
    setShowMenu(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-6">
      <div className="w-full max-w-3xl h-[80vh] bg-gray-900 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 w-9 h-9 rounded-full flex items-center justify-center font-semibold">
              A
            </div>
            <div>
              <div className="text-white font-semibold">Global Chat Room</div>
              <div className="text-xs text-gray-400">
                Saling ngobrol antar user
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              aria-label="settings"
              className="p-2 rounded-full hover:bg-gray-700"
              onClick={() => setShowMenu((s) => !s)}
            >
              <Settings size={20} className="text-gray-200" /> {/* ✅ ikon rapi */}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                <button
                  onClick={handleEditProfile}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700"
                >
                  Clear Chat
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* chat area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-800">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-8">
              Belum ada pesan
            </div>
          ) : (
            messages.map((m, i) => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              const mine = m.sender === user?.username;

              return (
                <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      mine ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {/* ✅ tampilkan nama pengirim */}
                    <div className="text-xs font-semibold mb-1 text-gray-300">
                      {m.sender || "Unknown"}
                    </div>

                    <div className="text-sm break-words">{m.message}</div>

                    {m.created_at && (
                      <div className="text-[10px] text-gray-300 mt-1 text-right">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* input */}
        <div className="px-6 py-4 bg-gray-800 flex items-center gap-3 border-t border-gray-700">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message here..."
            className="flex-1 rounded-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
