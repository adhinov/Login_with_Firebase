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

  // NEW → progress upload lingkaran
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Helper: deduplicate and add message safely
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      // check by id
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

      // check by file_url (most reliable for uploads)
      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url))
        return prev;

      // check by exact text + sender + near timestamp (within 5s)
      if (msg.message) {
        const msgTime = new Date(msg.created_at ?? msg.createdAt ?? Date.now()).getTime();
        const exists = prev.some((m) => {
          if (!m.message) return false;
          const mt = new Date(m.created_at ?? m.createdAt ?? 0).getTime();
          return (
            m.message === msg.message &&
            (m.sender_email ?? "") === (msg.sender_email ?? "") &&
            Math.abs(mt - msgTime) < 5000
          );
        });
        if (exists) return prev;
      }

      // otherwise add
      return [...prev, msg];
    });
  };

  // GET MESSAGES
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

  // SOCKET IO
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      socket.emit("join", {
        userId,
        username: username || user?.email || "User",
      });
    };

    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);

    socket.on("onlineUsers", (count: number) => {
      setOnlineCount(count ?? 0);
    });

    socket.on("receiveMessage", (msg: Message) => {
      if (!msg) return;

      const normalized: Message = {
        ...msg,
        created_at: msg.created_at ?? msg.createdAt ?? new Date().toISOString(),
      };

      // use dedupe add
      addMessageIfNotExists(normalized);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
    // note: keep userId, username in deps as before
  }, [userId, username]);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND TEXT MESSAGE
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

    if (socket && socket.connected) {
      // emit to server and let server broadcast (server should send receiveMessage back to everyone or others)
      socket.emit("sendMessage", msg);
    }

    // DO NOT push local here — rely on receiveMessage to avoid duplicates
    setInput("");
  };

  // UPLOAD OTOMATIS (with token check, progress init, dedupe)
  const sendImageAuto = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token tidak ditemukan — silakan login ulang sebelum upload.");
      // optional: redirect to login
      alert("Sesi berakhir. Silakan login ulang.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("message", "");
    form.append("sender_id", String(userId));
    form.append("sender_email", user?.email ?? "");
    form.append("sender_name", username);

    try {
      // start progress indicator immediately (0%)
      setUploadProgress(0);

      const res = await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (evt) => {
          const percent = Math.round((evt.loaded * 100) / (evt.total ?? 1));
          setUploadProgress(percent);
        },
      });

      // success
      const finalMsg: Message = { ...res.data, sender_name: username };

      // reset progress
      setUploadProgress(null);

      // add message safely (dedupe)
      addMessageIfNotExists(finalMsg);

      // inform server (emit) — if server broadcasts to everyone including sender, dedupe prevents duplicate
      if (socket && socket.connected) {
        socket.emit("sendMessage", finalMsg);
      }
    } catch (err: any) {
      // network / server error
      console.error("Upload gagal:", err?.response ?? err);
      // handle 401 explicitly
      if (err?.response?.status === 401) {
        console.error("Upload gagal: 401 Unauthorized — token mungkin kedaluwarsa.");
        alert("Sesi berakhir. Silakan login ulang.");
      }
      setUploadProgress(null);
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowUpload(false);
    sendImageAuto(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex justify-center h-screen bg-gray-950 p-0">
      <div className="w-full max-w-3xl h-full bg-gray-900 shadow-xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-gray-850 border-b border-gray-700 px-4 py-3 flex-shrink-0">
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

        {/* CHAT */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-850">

          {/* ---- UPLOAD PROGRESS BUBBLE (WhatsApp-like) ---- */}
          {uploadProgress !== null && (
            <div className="flex items-end justify-end pr-2">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-none relative">
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center bg-blue-500">
                  <span className="text-[10px] font-bold text-white">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="text-xs text-gray-200">Mengunggah...</div>
              </div>
            </div>
          )}

          {/* NORMAL MESSAGES */}
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

                  {/* TEXT */}
                  {m.message && (
                    <div className="text-sm break-words leading-snug">
                      {m.message}
                    </div>
                  )}

                  {/* TIME */}
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

        {/* INPUT */}
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

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ketik pesan..."
              className="flex-1 rounded-full px-4 py-3 bg-gray-700 text-white text-sm sm:text-base focus:outline-none"
            />

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
