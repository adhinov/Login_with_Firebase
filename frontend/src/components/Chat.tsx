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

  // ============================
  // FETCH PESAN AWAL
  // ============================
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

  // ============================
  // SOCKET REALTIME
  // ============================
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

      setMessages((prev) => {
        const exists = prev.some((m) => {
          const t1 = new Date(m.created_at ?? m.createdAt ?? 0).getTime();
          const t2 = new Date(normalized.created_at ?? 0).getTime();
          return (
            m.message === normalized.message &&
            m.sender_email === normalized.sender_email &&
            Math.abs(t1 - t2) < 500
          );
        });

        return exists ? prev : [...prev, normalized];
      });
    });

    return () => {
      socket.off("connect", doJoin);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, [userId, username]);

  // ============================
  // AUTO SCROLL
  // ============================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================
  // KIRIM TEXT
  // ============================
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

  // ============================
  // KIRIM GAMBAR
  // ============================
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

      // Pastikan nama langsung benar
      const finalMsg = {
        ...res.data,
        sender_name: username, // <--- FIX UTAMA
      };

      // kirim realtime
      if (socket && socket.connected) {
        socket.emit("sendMessage", finalMsg);
      }

      // tampilkan ke UI sendiri
      setMessages((prev) => [...prev, finalMsg]);

      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      console.error("Upload gagal:", err);
    }
  };

  // pilih gambar
  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setShowUpload(false);
  };

  // download WA style
  const handleDownloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop() || "image.jpg";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-2 sm:p-4">
      <div className="w-full max-w-3xl h-[100vh] sm:h-[85vh] bg-gray-900 shadow-xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white">
                {username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{username}</div>
                <div className="text-xs text-gray-400">{onlineCount} online</div>
              </div>
            </div>

            {/* GEAR */}
            <div className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <Settings size={20} className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-11 bg-gray-800 border border-gray-700 shadow-lg rounded-md text-white w-32">
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

        {/* CHAT */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-800">
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
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {/* NAMA */}
                  <div className="text-xs text-yellow-300 mb-1">
                    {displayName}
                  </div>

                  {/* GAMBAR */}
                  {m.file_type?.startsWith("image/") && m.file_url && (
                    <div
                      onClick={() => handleDownloadImage(m.file_url!)}
                      className="mb-2 cursor-pointer"
                    >
                      <img
                        src={m.file_url!}
                        className="w-28 h-28 object-cover rounded-lg blur-[1px] brightness-75"
                      />
                      <div className="text-xs text-gray-300 mt-1 text-center">
                        Klik untuk Download
                      </div>
                    </div>
                  )}

                  {/* TEXT */}
                  {m.message && (
                    <div className="text-sm break-words">{m.message}</div>
                  )}

                  {/* WAKTU */}
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

        {/* PREVIEW */}
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

        {/* INPUT */}
        <footer className="px-4 py-3 bg-gray-800 flex items-center gap-3">
          {/* + MENU */}
          <div className="relative">
            <button
              className="p-2 hover:bg-gray-700 rounded-full"
              onClick={() => setShowUpload((s) => !s)}
            >
              <Plus size={22} className="text-white" />
            </button>

            {showUpload && (
              <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                {/* UPLOAD GAMBAR */}
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

          {/* INPUT TEKS */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 rounded-full px-4 py-2 bg-gray-700 text-white"
          />

          {/* SEND */}
          <button
            onClick={sendMessage}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Send size={20} />
          </button>
        </footer>
      </div>
    </div>
  );
}
