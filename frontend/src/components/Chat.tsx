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

  // upload preview state (WhatsApp style, 130px)
  const [uploadPreview, setUploadPreview] = useState<{ url: string; progress: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // dedupe add message helper
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      // by id
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

      // by file_url
      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url)) return prev;

      // by identical text + sender + near timestamp (~5s)
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

      return [...prev, msg];
    });
  };

  // fetch messages on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        const data: Message[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setMessages(data);
        // scroll after short delay to ensure DOM painted
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .catch((err) => console.error("Gagal ambil pesan:", err));
  }, [API_URL]);

  // socket listeners
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
      // scroll to bottom when new message arrives
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
    // keep deps minimal to avoid reconnect loops
  }, [userId, username]);

  // auto scroll on messages or preview changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploadPreview]);

  // send text message (emit to server; server will broadcast)
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

    try {
      // send to server endpoint to have consistent DB save + broadcast
      const token = localStorage.getItem("token");
      // If your backend accepts a plain text message endpoint, use it.
      // Here we reuse the /upload endpoint with empty file for consistency (if backend supports)
      // Otherwise you may have a dedicated text/send endpoint - adjust accordingly.
      const res = await axios.post(
        `${API_URL}/api/messages/upload`,
        // sending as JSON fallback (some backends accept text via body)
        // If your backend expects form-data even for text, adjust accordingly.
        { message: msg.message },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      // if backend returns saved message, it will broadcast; dedupe will prevent duplication
      setInput("");
    } catch (err) {
      // fallback: still emit via socket if API fails (keeps previous behaviour)
      console.error("Kirim teks via API gagal, emit socket sebagai fallback:", err);
      socket.emit("sendMessage", msg);
      setInput("");
    }
  };

  // upload file with progress and WhatsApp style thumbnail above input
  const uploadFile = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi berakhir. Silakan login ulang.");
      return;
    }

    // show local thumbnail immediately (130px)
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

      // server returned saved message
      const finalMsg: Message = { ...res.data };

      // add locally safely (dedupe prevents duplicate if server broadcasts receiveMessage)
      addMessageIfNotExists(finalMsg);

      // clear preview (slight delay so user sees 100%)
      setTimeout(() => setUploadPreview(null), 400);

      // NOTE: do NOT emit here if your backend already broadcasts from upload handler.
      // Emitting here may cause duplicates unless dedupe is used. We already added message locally.
    } catch (err: any) {
      console.error("Upload gagal:", err?.response ?? err);
      setUploadPreview(null);
      if (err?.response?.status === 401) {
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

  // small circular SVG used inside thumbnail overlay (we'll render percent text separately)
  const SmallCircle = ({ percent }: { percent: number }) => {
    const size = 48;
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
          style={{ transition: "stroke-dashoffset 150ms linear" }}
        />
      </svg>
    );
  };

  return (
    <div className="chat-container">

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-gray-850 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg">
              {username?.[0]?.toUpperCase()}
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
                <button onClick={handleLogout} className="px-4 py-2 w-full hover:bg-gray-700 text-white text-left">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHAT LIST */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Messages */}
        {messages.map((m, i) => {
          const mine = (m.sender_email ?? "").toLowerCase() === (user?.email ?? "").toLowerCase();
          const ts = m.created_at ?? m.createdAt ?? "";
          const displayName = m.sender_name || (m.sender_email ? m.sender_email.split("@")[0] : "User");

          return (
            <div key={m.id ?? i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[78%] sm:max-w-[70%] px-4 py-2 rounded-2xl ${mine ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"}`}>
                <div className="text-xs text-yellow-300 mb-1">{displayName}</div>

                {m.file_type?.startsWith("image/") && m.file_url && (
                  <img src={m.file_url} className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg mb-2 cursor-pointer" onClick={() => window.open(m.file_url!, "_blank")} />
                )}

                {m.message && <div className="text-sm break-words leading-snug">{m.message}</div>}

                <div className="text-[10px] text-gray-300 mt-1 text-right">
                  {ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload preview — rendered near bottom so it's above input (WhatsApp style) */}
        {uploadPreview && (
          <div className="flex justify-end pr-2">
            <div className="relative w-[130px] h-[130px] rounded-xl overflow-hidden border border-gray-600">
              <img src={uploadPreview.url} className="w-full h-full object-cover opacity-60" />

              <div className="absolute inset-0 flex items-center justify-center">
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
      <div className="chat-input-wrapper">
        <div className="relative">
          <button className="p-2 hover:bg-gray-700 rounded-full addfile-btn" onClick={() => setShowUpload((s) => !s)}>
            <Plus />
          </button>

          {showUpload && (
            <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
              <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm cursor-pointer text-white">
                <ImageIcon size={18} /> Upload Gambar
                <input type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
              </label>
            </div>
          )}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ketik pesan..."
          className="chat-input"
        />

        <button onClick={sendMessage} className="send-btn" aria-label="Kirim pesan">
          <Send className="text-white" />
        </button>
      </div>
    </div>
  );
}
