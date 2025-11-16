"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "@/lib/socket";
import { Settings, Send, Image as ImageIcon, Plus } from "lucide-react";

interface Message {
  id?: number | string;
  sender_id?: number | null;
  sender_email?: string | null;
  sender_name?: string | null;
  message?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

interface ChatProps {
  userId: number;
  username?: string;
}

export default function Chat({ userId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [uploadPreview, setUploadPreview] = useState<{ url: string; progress: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // display name fallback
  const displayName =
    username ||
    user?.username ||
    user?.name ||
    (user?.email ? String(user.email).split("@")[0] : undefined) ||
    "User";

  // add message if not exists
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      if (!msg) return prev;

      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url)) return prev;

      if (msg.message) {
        const msgTime = new Date(msg.created_at ?? msg.createdAt ?? Date.now()).getTime();
        const exists = prev.some((m) => {
          if (!m.message) return false;
          const mt = new Date(m.created_at ?? m.createdAt ?? 0).getTime();
          return (
            m.message === msg.message &&
            (m.sender_email ?? "") === (msg.sender_email ?? "") &&
            Math.abs(mt - msgTime) < 3000
          );
        });
        if (exists) return prev;
      }

      return [...prev, msg];
    });
  };

  // fetch messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        const data: Message[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setMessages(data);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      })
      .catch((err) => console.error("Fetch pesan gagal:", err));
  }, [API_URL]);

  // socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      socket.emit("join", { userId, username: displayName });
    };

    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);

    socket.on("onlineUsers", (count: number) => setOnlineCount(count ?? 0));

    socket.on("receiveMessage", (msg: Message) => {
      if (!msg) return;

      const normalized: Message = {
        ...msg,
        created_at: msg.created_at ?? msg.createdAt ?? new Date().toISOString(),
      };

      addMessageIfNotExists(normalized);

      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, [userId, displayName]);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploadPreview]);

  // send text message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Sesi habis. Login ulang.");

    const msg: Message = {
      id: Date.now(),
      sender_id: userId,
      sender_email: user?.email ?? "",
      sender_name: displayName,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    addMessageIfNotExists(msg);
    setInput("");

    try {
      await axios.post(
        `${API_URL}/api/messages/upload`,
        { message: msg.message, sender_name: msg.sender_name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("POST gagal:", err);
      socket.emit("sendMessage", msg);
    }

    socket.emit("sendMessage", msg);
  };

  // upload image
  const uploadFile = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Sesi habis. Login ulang.");

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ url: previewUrl, progress: 1 });

    const form = new FormData();
    form.append("file", file);
    form.append("message", "");
    form.append("sender_id", String(userId));
    form.append("sender_email", user?.email ?? "");
    form.append("sender_name", displayName);

    try {
      const res = await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e: any) => {
          const percent = Math.round((e.loaded * 100) / (e.total || 1));
          setUploadPreview((prev) =>
            prev ? { ...prev, progress: percent } : { url: previewUrl, progress: percent }
          );
        },
      });

      const finalMsg: Message = res.data;
      addMessageIfNotExists(finalMsg);

      socket.emit("sendMessage", finalMsg);

      setTimeout(() => setUploadPreview(null), 300);
    } catch (err) {
      console.error("Upload gagal:", err);
      setUploadPreview(null);
    }
  };

  // progress circle
  const CircularProgress = ({ percent }: { percent: number }) => {
    const size = 56;
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 140ms linear" }}
        />
      </svg>
    );
  };

  return (
    <div className="w-full h-[100dvh] flex justify-center bg-gray-900 overflow-hidden">
      <div className="w-full h-full max-w-[920px] flex flex-col bg-gray-850 border-x border-gray-700">

        {/* HEADER */}
        <div className="sticky top-0 z-20 bg-gray-850 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg">
                {displayName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{displayName}</div>
                <div className="text-xs text-gray-400">{onlineCount} online</div>
              </div>
            </div>

            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-700 rounded-full">
                <Settings size={18} className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 bg-gray-800 w-36 rounded-md shadow-lg">
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/login";
                    }}
                    className="px-4 py-2 w-full hover:bg-gray-700 text-white text-sm text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-4">
          {messages.map((m, i) => {
            const mine =
              (m.sender_email ?? "").toLowerCase() === (user?.email ?? "").toLowerCase();

            const ts = m.created_at ?? m.createdAt ?? "";

            const display =
              mine
                ? "You"
                : m.sender_name ||
                  (m.sender_email ? String(m.sender_email).split("@")[0] : "User");

            return (
              <div key={m.id ?? i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                
                {/* BUBBLE */}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {/* USERNAME IN BUBBLE */}
                  <div className="text-xs font-semibold mb-1" style={{ color: "#FFD938" }}>
                    {display}
                  </div>

                  {/* IMAGE */}
                  {m.file_type?.startsWith("image/") && m.file_url && (
                    <img
                      src={m.file_url}
                      alt="file"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-md mb-2 cursor-pointer"
                      onClick={() => window.open(m.file_url!, "_blank")}
                    />
                  )}

                  {/* TEXT */}
                  {m.message && <div className="leading-snug break-words">{m.message}</div>}

                  {/* TIME */}
                  <div className="text-[9px] text-gray-300 text-right mt-1">
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

        {/* UPLOAD PREVIEW */}
        {uploadPreview && (
          <div className="px-4 pb-2 flex justify-end">
            <div className="relative w-[130px] h-[130px] rounded-xl overflow-hidden border border-gray-600">
              <img src={uploadPreview.url} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CircularProgress percent={uploadPreview.progress} />
              </div>
              <div className="absolute bottom-2 w-full text-center text-white font-semibold text-xs">
                {uploadPreview.progress}%
              </div>
            </div>
          </div>
        )}

        {/* INPUT AREA */}
        <div className="px-3 py-2 flex items-center gap-3 bg-gray-850 border-t border-gray-700 sticky bottom-0 z-10">

          {/* Add button */}
          <div className="relative">
            <button onClick={() => setShowUpload(!showUpload)} className="p-2 hover:bg-gray-700 rounded-full text-white">
              <Plus size={20} />
            </button>

            {showUpload && (
              <div className="absolute bottom-12 left-0 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1">
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm">
                  <ImageIcon size={18} /> Upload Gambar
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files && uploadFile(e.target.files[0])}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Input */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 px-3 py-2 bg-gray-800 rounded-xl text-white outline-none border border-gray-700 text-sm"
          />

          <button onClick={sendMessage} className="p-3 bg-blue-600 rounded-full text-white">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
