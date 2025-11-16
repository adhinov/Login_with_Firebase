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

  // WA-style preview upload
  const [uploadPreview, setUploadPreview] = useState<{ url: string; progress: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // =====================================================
  // HELPER prevent duplicate
  // =====================================================
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
      // by id
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

      // by file
      if (msg.file_url && prev.some((m) => m.file_url === msg.file_url)) return prev;

      // by identical content
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

  // =====================================================
  // FETCH MESSAGE ON MOUNT
  // =====================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        const data: Message[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setMessages(data);

        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      })
      .catch((err) => console.error("Fetch gagal:", err));
  }, [API_URL]);

  // =====================================================
  // SOCKET EVENTS
  // =====================================================
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
      const normalized = {
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
  }, [userId, username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploadPreview]);

  // =====================================================
  // SEND MESSAGE (FIXED: NOW SHOW IN OWN SCREEN)
  // =====================================================
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

    // ❗ FIX UTAMA 1 — tampil langsung
    addMessageIfNotExists(myLocalMsg);

    setInput("");

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/messages/upload`,
        { message: myLocalMsg.message },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      // server broadcast akan masuk via receiveMessage → dedupe cegah double
    } catch (err) {
      console.error("API gagal, fallback socket:", err);
      socket.emit("sendMessage", myLocalMsg);
    }
  };

  // =====================================================
  // UPLOAD FILE
  // =====================================================
  const uploadFile = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Silakan login ulang.");

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
          setUploadPreview((prev) =>
            prev ? { ...prev, progress: percent } : { url: previewUrl, progress: percent }
          );
        },
      });

      const finalMsg = { ...res.data };
      addMessageIfNotExists(finalMsg);

      setTimeout(() => setUploadPreview(null), 300);
    } catch (err) {
      console.error("Upload gagal:", err);
      setUploadPreview(null);
      if ((err as any)?.response?.status === 401) alert("Silakan login ulang.");
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

  return (
    <div
      className="
        w-full h-screen flex justify-center bg-gray-900
        overflow-hidden
      "
    >
      {/* FIX FULLSCREEN DI LAPTOP */}
      <div className="w-full h-full max-w-[500px] flex flex-col bg-gray-850 border-x border-gray-700">

        {/* ==================== HEADER ==================== */}
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
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <Settings className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-gray-800 w-36 rounded-md shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 w-full hover:bg-gray-700 text-white text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== CHAT LIST ==================== */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {messages.map((m, i) => {
            const mine =
              (m.sender_email ?? "").toLowerCase() ===
              (user?.email ?? "").toLowerCase();

            const ts = m.created_at ?? m.createdAt ?? "";
            const name =
              m.sender_name || (m.sender_email ? m.sender_email.split("@")[0] : "User");

            return (
              <div
                key={m.id ?? i}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`
                    max-w-[78%] sm:max-w-[70%] px-4 py-2 rounded-2xl 
                    ${mine ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"}
                  `}
                >
                  <div className="text-xs text-yellow-300 mb-1">{name}</div>

                  {m.file_type?.startsWith("image/") && m.file_url && (
                    <img
                      src={m.file_url}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg mb-2"
                    />
                  )}

                  {m.message && (
                    <div className="text-sm break-words leading-snug">{m.message}</div>
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

          {/* Upload Preview */}
          {uploadPreview && (
            <div className="flex justify-end pr-2">
              <div className="relative w-[130px] h-[130px] rounded-xl overflow-hidden border border-gray-600">
                <img
                  src={uploadPreview.url}
                  className="w-full h-full object-cover opacity-60"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="48" height="48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="#fff"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={
                        (2 * Math.PI * 20 * (100 - uploadPreview.progress)) / 100
                      }
                      style={{ transition: "stroke-dashoffset 120ms linear" }}
                    />
                  </svg>
                </div>

                <div className="absolute bottom-1 w-full text-center text-white font-semibold text-xs">
                  {uploadPreview.progress}%
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* ==================== INPUT AREA ==================== */}
        <div className="px-3 py-3 flex items-center gap-3 bg-gray-850 border-t border-gray-700">
          <div className="relative">
            <button
              onClick={() => setShowUpload((s) => !s)}
              className="p-2 hover:bg-gray-700 rounded-full text-white"
            >
              <Plus />
            </button>

            {showUpload && (
              <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm">
                  <ImageIcon size={18} />
                  Upload Gambar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectImage}
                  />
                </label>
              </div>
            )}
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white outline-none border border-gray-700"
          />

          <button
            onClick={sendMessage}
            className="p-2 bg-blue-600 rounded-full text-white"
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
}
