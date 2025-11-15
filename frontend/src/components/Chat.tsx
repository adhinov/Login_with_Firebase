"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "@/lib/socket";
import { Settings, Send, Image as ImageIcon, Video, Plus } from "lucide-react";

interface Message {
  id?: number | string;
  sender_id?: number | null;
  sender_email?: string | null;
  sender_name?: string | null;
  message: string;
  file_url?: string | null;
  file_type?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

interface ChatProps {
  userId: number;
  username: string;
}

export default function Chat({ userId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // ================================
  // GET MESSAGES
  // ================================
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_URL}/api/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        const data: Message[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];
        setMessages(data);
      })
      .catch((err) => console.error("Gagal ambil pesan:", err));
  }, [API_URL]);

  // ================================
  // SOCKET.IO
  // ================================
  useEffect(() => {
    if (!socket) return;

    const doJoin = () => {
      socket.emit("join", {
        userId,
        username: username || user?.email || "User",
      });
    };

    if (socket.connected) doJoin();
    socket.on("connect", doJoin);

    socket.on("onlineUsers", (count: number) => setOnlineCount(count ?? 0));

    socket.on("receiveMessage", (msg: Message) => {
      if (!msg) return;

      const normalized: Message = {
        ...msg,
        created_at: msg.created_at ?? msg.createdAt ?? new Date().toISOString(),
      };

      setMessages((prev) => [...prev, normalized]);
    });

    return () => {
      socket.off("connect", doJoin);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, [userId, username]);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================================
  // SEND TEXT
  // ================================
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

    if (socket && socket.connected) socket.emit("sendMessage", msg);

    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  // ================================
  // SEND IMAGE
  // ================================
  const sendImage = async () => {
    if (!imageFile) return;

    const form = new FormData();
    form.append("file", imageFile);
    form.append("message", "");
    form.append("sender_id", String(userId));
    form.append("sender_email", user?.email ?? "");
    form.append("sender_name", username);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      const finalMsg = { ...res.data, sender_name: username };

      if (socket && socket.connected) {
        socket.emit("sendMessage", finalMsg);
      }

      setMessages((prev) => [...prev, finalMsg]);

      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      console.error("Upload gagal:", err);
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setShowUpload(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ================================
  // UI
  // ================================
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-0">
      <div className="w-full max-w-3xl h-[100vh] bg-gray-900 shadow-xl flex flex-col overflow-hidden">

        {/* HEADER FIX HP */}
        <header className="sticky top-0 z-20 bg-gray-850 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-white text-lg">
                {username?.[0]?.toUpperCase()}
              </div>

              <div>
                <div className="text-white font-semibold text-base sm:text-lg">
                  {username}
                </div>
                <div className="text-xs text-gray-400">
                  {onlineCount} online
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <Settings size={22} className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-gray-800 border border-gray-600 shadow-lg rounded-md text-white w-36">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-gray-700 w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-850">
          {messages.map((m, i) => {
            const mine =
              (m.sender_email ?? "").toLowerCase() ===
              (user?.email ?? "").toLowerCase();

            const ts = m.created_at ?? m.createdAt ?? "";

            const displayName =
              m.sender_name ||
              (m.sender_email ? m.sender_email.split("@")[0] : "User");

            return (
              <div
                key={m.id ?? i}
                className={`flex flex-col ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-[70%] px-4 py-2 rounded-2xl ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="text-xs text-yellow-300 mb-1">
                    {displayName}
                  </div>

                  {/* IMAGE */}
                  {m.file_type?.startsWith("image/") && m.file_url && (
                    <img
                      src={m.file_url}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg mb-2 cursor-pointer"
                      onClick={() => window.open(m.file_url!, "_blank")}
                    />
                  )}

                  {m.message && (
                    <div className="text-sm break-words leading-snug">
                      {m.message}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-300 mt-1 text-right">
                    {ts
                      ? new Date(ts).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </main>

        {/* PREVIEW IMAGE */}
        {imagePreview && (
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                className="h-24 rounded-lg border border-gray-600"
              />
              <button
                onClick={sendImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Kirim Gambar
              </button>
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* INPUT FIX HP */}
        <div className="sticky bottom-0 bg-gray-850 border-t border-gray-700 px-4 py-3">
          <footer className="flex items-center gap-3">

            <div className="relative">
              <button
                className="p-2 hover:bg-gray-700 rounded-full"
                onClick={() => setShowUpload((s) => !s)}
              >
                <Plus size={24} className="text-white" />
              </button>

              {showUpload && (
                <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                  <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm cursor-pointer">
                    <ImageIcon size={18} />
                    Upload Gambar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelectImage}
                    />
                  </label>

                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm text-gray-200">
                    <Video size={18} /> Upload Video
                  </button>
                </div>
              )}
            </div>

            {/* INPUT */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ketik pesan..."
              className="flex-1 rounded-full px-4 py-3 bg-gray-700 text-white text-sm sm:text-base focus:outline-none"
            />

            {/* SEND BUTTON BIGGER ON MOBILE */}
            <button
              onClick={sendMessage}
              className="p-3 sm:p-3 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              <Send size={20} className="text-white" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
