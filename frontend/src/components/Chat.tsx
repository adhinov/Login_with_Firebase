"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Settings } from "lucide-react";

interface Message {
  id?: number;
  sender_id?: number;
  sender_email?: string;
  message: string;
  file_url?: string | null;
  file_type?: string | null;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // ambil pesan awal dan polling
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
      sender_id: user?.id,
      sender_email: user?.email,
    };

    // tampilkan pesan langsung (optimistic update)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_id: payload.sender_id,
        sender_email: payload.sender_email,
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
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-2 sm:p-6">
      <div className="w-full sm:max-w-3xl h-[90vh] sm:h-[80vh] bg-gray-900 rounded-none sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold">
              A
            </div>
            <div>
              <div className="text-white font-semibold text-sm sm:text-base">
                Global Chat Room
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400">
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
              <Settings size={18} className="text-gray-200" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                <button
                  onClick={handleEditProfile}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                >
                  Clear Chat
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* chat area */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-gray-800">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-6 text-sm sm:text-base">
              Belum ada pesan
            </div>
          ) : (
            messages.map((m, i) => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              const senderName = m.sender_email || "Unknown";
              const mine =
                senderName?.toLowerCase() ===
                (user?.email || "").toLowerCase();

              return (
                <div
                  key={i}
                  className={`flex ${
                    mine ? "justify-end" : "justify-start"
                  } break-words`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-2xl ${
                      mine
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {!mine && (
                      <div className="text-[10px] sm:text-xs font-semibold mb-1 text-gray-300 truncate">
                        {senderName}
                      </div>
                    )}

                    <div className="text-sm sm:text-base break-words leading-snug sm:leading-normal">
                      {m.message}
                    </div>

                    {m.created_at && (
                      <div className="text-[9px] sm:text-[10px] text-gray-300 mt-1 text-right">
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

        {/* input area */}
        <div className="px-3 sm:px-6 py-3 bg-gray-800 flex items-center gap-2 sm:gap-3 border-t border-gray-700">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 rounded-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
