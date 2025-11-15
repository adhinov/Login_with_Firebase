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

  /** NEW: Thumbnail preview */
  const [uploadPreview, setUploadPreview] = useState<{
    url: string;
    progress: number;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  /** ADD MESSAGE (dedupe) */
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url)) return prev;
      return [...prev, msg];
    });
  };

  /** GET HISTORY */
  useEffect(() => {
    axios
      .get(`${API_URL}/api/messages`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        setMessages(data);
      })
      .catch(console.error);
  }, []);

  /** SOCKET IO */
  useEffect(() => {
    socket.emit("join", {
      userId,
      username: username || user?.email,
    });

    socket.on("onlineUsers", setOnlineCount);

    socket.on("receiveMessage", (msg: Message) => {
      if (!msg) return;
      const normalized: Message = {
        ...msg,
        created_at: msg.created_at ?? msg.createdAt ?? new Date().toISOString(),
      };
      addMessageIfNotExists(normalized);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, []);

  /** AUTO SCROLL */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploadPreview]);

  /** SEND TEXT */
  const sendMessage = () => {
    if (!input.trim()) return;

    const msg: Message = {
      id: Date.now(),
      sender_id: userId,
      sender_email: user?.email,
      sender_name: username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    socket.emit("sendMessage", msg);
    setInput("");
  };

  /** UPLOAD IMAGE */
  const uploadFile = async (file: File) => {
    const token = localStorage.getItem("token");

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ url: previewUrl, progress: 1 });

    const form = new FormData();
    form.append("file", file);
    form.append("sender_id", String(userId));
    form.append("sender_email", user?.email);
    form.append("sender_name", username);

    try {
      const res = await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / (e.total || 1));
          setUploadPreview((prev) => ({ ...prev!, progress: percent }));
        },
      });

      // hide preview
      setUploadPreview(null);

      // send to server
      socket.emit("sendMessage", res.data);
    } catch (err) {
      console.error(err);
      setUploadPreview(null);
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowUpload(false);
    uploadFile(file);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  /** Circular progress for thumbnail */
  const CircularProgress = ({ percent }: { percent: number }) => {
    const size = 48;
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
    );
  };

  return (
    <div className="flex justify-center h-screen bg-gray-950">
      <div className="w-full max-w-3xl h-full bg-gray-900 shadow-xl flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-gray-850 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg">
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{username}</div>
                <div className="text-xs text-gray-400">{onlineCount} online</div>
              </div>
            </div>

            <div className="relative">
              <button onClick={() => setShowMenu((s) => !s)} className="p-2 hover:bg-gray-700 rounded-full">
                <Settings className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-gray-800 w-36 rounded-md shadow-lg">
                  <button
                    onClick={logout}
                    className="px-4 py-2 w-full hover:bg-gray-700 text-white text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CHAT LIST */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* THUMBNAIL PREVIEW (WhatsApp style) */}
          {uploadPreview && (
            <div className="flex justify-end">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-gray-600">
                <img
                  src={uploadPreview.url}
                  className="w-full h-full object-cover opacity-60"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <CircularProgress percent={uploadPreview.progress} />
                </div>

                <div className="absolute bottom-2 w-full text-center text-white font-semibold text-sm">
                  {uploadPreview.progress}%
                </div>
              </div>
            </div>
          )}

          {/* NORMAL MESSAGES */}
          {messages.map((m, i) => {
            const mine = m.sender_email === user?.email;

            return (
              <div key={i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2 rounded-2xl ${
                    mine ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
                  }`}
                >
                  <div className="text-xs text-yellow-300">
                    {m.sender_name}
                  </div>

                  {m.file_url && (
                    <img
                      src={m.file_url}
                      className="w-40 h-40 rounded-lg my-1 object-cover cursor-pointer"
                      onClick={() => window.open(m.file_url!, "_blank")}
                    />
                  )}

                  {m.message && <div>{m.message}</div>}

                  <div className="text-[10px] text-gray-300 text-right mt-1">
                    {new Date(m.created_at || "").toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </main>

        {/* INPUT */}
        <footer className="sticky bottom-0 bg-gray-850 px-4 py-3 border-t border-gray-700 flex items-center gap-3">

          {/* MENU BUTTON */}
          <div className="relative">
            <button onClick={() => setShowUpload((s) => !s)} className="p-2 hover:bg-gray-700 rounded-full">
              <Plus className="text-white" />
            </button>

            {showUpload && (
              <div className="absolute bottom-12 bg-gray-800 w-40 rounded-md shadow-lg">
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 cursor-pointer text-white">
                  <ImageIcon size={18} /> Upload Gambar
                  <input type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
                </label>
              </div>
            )}
          </div>

          {/* TEXT INPUT */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-3 outline-none"
          />

          <button
            onClick={sendMessage}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="text-white" />
          </button>
        </footer>
      </div>
    </div>
  );
}
