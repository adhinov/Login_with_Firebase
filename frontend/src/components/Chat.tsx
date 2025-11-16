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
  username: string;
}

export default function Chat({ userId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  // WhatsApp-style upload preview (130px) with progress 0-100
  const [uploadPreview, setUploadPreview] = useState<{ url: string; progress: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // ---------------------------
  // Helpers
  // ---------------------------
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      // by id
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

      // by file url (uploads)
      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url)) return prev;

      // by identical text + sender + near timestamp (<4s)
      if (msg.message) {
        const msgTime = new Date(msg.created_at ?? msg.createdAt ?? Date.now()).getTime();
        const exists = prev.some((m) => {
          if (!m.message) return false;
          const mt = new Date(m.created_at ?? m.createdAt ?? 0).getTime();
          return (
            m.message === msg.message &&
            (m.sender_email ?? "") === (msg.sender_email ?? "") &&
            Math.abs(mt - msgTime) < 4000
          );
        });
        if (exists) return prev;
      }

      return [...prev, msg];
    });
  };

  // scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    try {
      chatEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    } catch (_) {}
  };

  // ---------------------------
  // Fetch initial messages
  // ---------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        const data: Message[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setMessages(data);
        // allow DOM to paint then scroll
        setTimeout(() => scrollToBottom(false), 50);
      })
      .catch((err) => {
        console.error("Gagal ambil pesan:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  // ---------------------------
  // Socket.io wiring
  // ---------------------------
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

    socket.on("onlineUsers", (count: number) => setOnlineCount(count ?? 0));

    socket.on("receiveMessage", (msg: Message) => {
      if (!msg) return;
      const normalized: Message = {
        ...msg,
        created_at: msg.created_at ?? msg.createdAt ?? new Date().toISOString(),
      };

      addMessageIfNotExists(normalized);
      // small delay then scroll
      setTimeout(() => scrollToBottom(), 40);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
    // keep deps minimal intentionally
  }, [userId, username]);

  // auto-scroll on messages / preview changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadPreview]);

  // ---------------------------
  // Send text message
  // - show locally immediately (so sender sees bubble)
  // - try API POST to save & let server broadcast
  // - if API fails fallback to socket.emit
  // ---------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const myLocalMsg: Message = {
      id: Date.now(),
      sender_id: userId,
      sender_email: user?.email ?? "",
      sender_name: username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    // 1) show on own UI immediately
    addMessageIfNotExists(myLocalMsg);
    setInput("");

    // 2) try to save via API so server can broadcast to all
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/api/messages/upload`,
        { message: myLocalMsg.message },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      // server should broadcast and dedupe prevents duplicates
    } catch (err) {
      // fallback to socket if API fails
      console.warn("API text send failed, fallback to socket emit:", err);
      if (socket && socket.connected) {
        socket.emit("sendMessage", myLocalMsg);
      }
    }
  };

  // ---------------------------
  // Upload file (WhatsApp-style thumbnail above input)
  // - show preview immediately (130px)
  // - update progress
  // - when server returns saved message, add it locally (no emit)
  // ---------------------------
  const uploadFile = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi berakhir. Silakan login ulang.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ url: previewUrl, progress: 1 });

    const form = new FormData();
    form.append("file", file);
    form.append("message", "");
    form.append("sender_id", String(userId));
    form.append("sender_email", user?.email ?? "");
    form.append("sender_name", username ?? "");

    try {
      const res = await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / (e.total || 1));
          setUploadPreview((prev) => (prev ? { ...prev, progress: percent } : { url: previewUrl, progress: percent }));
        },
      });

      // server returns saved message (and the server also broadcasts to everyone)
      const finalMsg: Message = { ...res.data };

      // add locally (dedupe prevents duplication if broadcast arrives)
      addMessageIfNotExists(finalMsg);

      // keep preview for a short moment so user sees 100%
      setTimeout(() => setUploadPreview(null), 350);
    } catch (err) {
      console.error("Upload gagal:", err);
      setUploadPreview(null);
      if ((err as any)?.response?.status === 401) {
        alert("Sesi berakhir. Silakan login ulang.");
      }
    }
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowUpload(false);
    uploadFile(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ---------------------------
  // Small circular SVG for overlay
  // ---------------------------
  const SmallCircle = ({ percent }: { percent: number }) => {
    const size = 56; // slightly bigger for 130px preview
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);

    return (
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
    );
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="flex justify-center min-h-screen bg-gray-900 p-0">
      {/* container width tuned for laptop while responsive on mobile */}
      <div className="w-full max-w-3xl h-full min-h-screen bg-gray-850 shadow-xl flex flex-col border-x border-gray-700">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-gray-850 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">{username}</div>
                <div className="text-xs text-gray-400">{onlineCount} online</div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-2 hover:bg-gray-700 rounded-full"
                aria-label="Menu"
              >
                <Settings className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-gray-800 w-40 rounded-md shadow-lg">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN: messages */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4">
          {/* map messages */}
          {messages.map((m, i) => {
            const mine = (m.sender_email ?? "").toLowerCase() === (user?.email ?? "").toLowerCase();
            const ts = m.created_at ?? m.createdAt ?? "";
            const displayName = m.sender_name || (m.sender_email ? m.sender_email.split("@")[0] : "User");

            return (
              <div key={m.id ?? i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[82%] sm:max-w-[70%] px-4 py-2 rounded-2xl ${
                    mine ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {/* display name (kept visible) */}
                  <div className="text-xs text-yellow-300 mb-1">{displayName}</div>

                  {m.file_type?.startsWith("image/") && m.file_url && (
                    <img
                      src={m.file_url}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg mb-2 cursor-pointer"
                      onClick={() => window.open(m.file_url!, "_blank")}
                      alt="uploaded"
                    />
                  )}

                  {m.message && <div className="text-sm break-words leading-snug">{m.message}</div>}

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

          {/* Upload preview (WhatsApp style) - placed inside messages list so it appears above input */}
          {uploadPreview && (
            <div className="flex justify-end pr-2">
              <div className="relative w-[130px] h-[130px] rounded-xl overflow-hidden border border-gray-600">
                <img src={uploadPreview.url} className="w-full h-full object-cover opacity-60" alt="preview" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <SmallCircle percent={uploadPreview.progress} />
                </div>
                <div className="absolute bottom-1 w-full text-center text-white font-semibold text-xs">
                  {uploadPreview.progress}%
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* INPUT AREA (sticky bottom) */}
        <footer
          className="sticky bottom-0 z-40 bg-gray-850 px-3 sm:px-4 py-3 border-t border-gray-700"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3">
            {/* add file button */}
            <div className="relative">
              <button
                onClick={() => setShowUpload((s) => !s)}
                className="p-2 hover:bg-gray-700 rounded-full text-white"
                aria-label="Tambah file"
              >
                <Plus />
              </button>

              {showUpload && (
                <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                  <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm cursor-pointer text-white">
                    <ImageIcon size={18} />
                    Upload Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
                  </label>
                </div>
              )}
            </div>

            {/* input - responsive, ensures send button doesn't overlap on small screens */}
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ketik pesan..."
                className="w-full pr-16 px-4 py-3 bg-gray-800 rounded-full text-white outline-none border border-gray-700 text-sm sm:text-base"
              />
            </div>

            {/* send button */}
            <div className="flex-shrink-0">
              <button
                onClick={sendMessage}
                className="p-3 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-md"
                aria-label="Kirim pesan"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
