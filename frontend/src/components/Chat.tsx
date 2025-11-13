"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "@/lib/socket";
import { Settings } from "lucide-react";

interface Message {
  id?: number;
  sender_id?: number | null;
  sender_email?: string | null;
  sender_name?: string | null;
  message: string;
  file_url?: string | null;
  file_type?: string | null;
  created_at?: string | null;
}

interface ChatProps {
  userId: number;
  username: string;
}

export default function Chat({ userId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // === Ambil pesan awal dari backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data: Message[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];
        setMessages(data);
      } catch (err) {
        console.error("Gagal ambil pesan:", err);
      }
    };
    fetchMessages();
  }, [API_URL]);

  // === Setup Socket.IO ===
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join", {
        userId,
        username: username || user?.email || "User",
      });
    });

    // update jumlah user online
    socket.on("onlineUsers", (count: number) => {
      setOnlineCount(count ?? 0);
    });

    // terima pesan global dari backend
    socket.on("receiveMessage", (msg: Message) => {
      console.log("📩 receiveMessage:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("disconnect", (reason: string) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("onlineUsers");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [userId, username]);

  // === Auto scroll ke bawah
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === Kirim pesan
  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg: Message = {
      id: Date.now(),
      sender_id: userId,
      sender_email: user?.email ?? null,
      sender_name: username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    // kirim ke server via socket
    if (socket.connected) {
      socket.emit("sendMessage", msg);
    } else {
      // fallback ke REST API jika socket mati
      const token = localStorage.getItem("token");
      try {
        await axios.post(
          `${API_URL}/api/messages/upload`,
          {
            message: msg.message,
            sender_id: msg.sender_id,
            sender_email: msg.sender_email,
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
      } catch (err) {
        console.error("Gagal kirim pesan:", err);
      }
    }

    // tambahkan langsung ke UI (optimistic)
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  // === Menu handler ===
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

  // === UI ===
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-2 sm:p-4">
      <div className="w-full max-w-3xl h-[100vh] sm:h-[85vh] bg-gray-900 rounded-none sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white">
                {username?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">
                  {username || user?.email || "User"}
                </div>
                <div className="text-xs text-gray-400">{onlineCount} online</div>
              </div>
            </div>

            <div className="relative">
              <button
                aria-label="settings"
                className="p-2 rounded-full hover:bg-gray-700"
                onClick={() => setShowMenu((s) => !s)}
              >
                <Settings size={20} className="text-gray-200" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-30">
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
        </header>

        {/* CHAT AREA */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 bg-gray-800">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-8 text-sm sm:text-base">
              Belum ada pesan
            </div>
          ) : (
            messages.map((m, i) => {
              const mine =
                (m.sender_email ?? "").toLowerCase() ===
                (user?.email ?? "").toLowerCase();
              return (
                <div
                  key={m.id ?? i}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${
                      mine
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-700 text-gray-100 rounded-bl-none"
                    }`}
                  >
                    {!mine && (
                      <div className="text-[11px] sm:text-xs font-semibold mb-1 text-gray-300 break-all">
                        {m.sender_name || m.sender_email || "Unknown"}
                      </div>
                    )}
                    <div className="text-sm sm:text-base break-words">{m.message}</div>
                    {m.created_at && (
                      <div className="text-[9px] sm:text-[10px] text-gray-300 mt-1 text-right">
                        {new Date(m.created_at!).toLocaleTimeString([], {
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
        </main>

        {/* INPUT */}
        <footer className="px-3 sm:px-6 py-3 bg-gray-800 flex items-center gap-2 sm:gap-3 border-t border-gray-700">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 rounded-full px-4 py-2.5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
          >
            Kirim
          </button>
        </footer>
      </div>
    </div>
  );
}
