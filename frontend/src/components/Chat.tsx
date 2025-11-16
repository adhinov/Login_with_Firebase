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

  // progress upload (thumbnail 130px)
  const [uploadPreview, setUploadPreview] = useState<{ url: string; progress: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Cegah pesan dobel
  const addMessageIfNotExists = (msg: Message) => {
    setMessages((prev) => {
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

  // Fetch pesan awal
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

        setTimeout(
          () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      })
      .catch((err) => console.error("Fetch gagal:", err));
  }, [API_URL]);

  // SOCKET listener
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

      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
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

  // KIRIM PESAN TEXT
  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg = {
      id: Date.now(),
      sender_id: userId,
      sender_email: user?.email ?? "",
      sender_name: username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    addMessageIfNotExists(msg);
    setInput("");

    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${API_URL}/api/messages/upload`,
        { message: msg.message },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
    } catch (err) {
      console.error("API gagal:", err);
    }

    socket.emit("sendMessage", msg);
  };

  // UPLOAD FILE + PROGRESS CIRCLE
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
          setUploadPreview((p) => (p ? { ...p, progress: percent } : null));
        },
      });

      const finalMsg = res.data;
      addMessageIfNotExists(finalMsg);
      socket.emit("sendMessage", finalMsg);

      setTimeout(() => setUploadPreview(null), 400);
    } catch (err) {
      console.error("Upload gagal:", err);
      setUploadPreview(null);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center bg-gray-900 overflow-hidden">

      <div className="w-full h-full max-w-[700px] flex flex-col bg-gray-850 border-x border-gray-700">

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
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-700 rounded-full">
                <Settings className="text-white" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-gray-800 w-36 rounded-md shadow-lg">
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/login";
                    }}
                    className="px-4 py-2 w-full hover:bg-gray-700 text-white text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CHAT LIST */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

          {messages.map((m, i) => {
            const mine =
              (m.sender_email ?? "").toLowerCase() ===
              (user?.email ?? "").toLowerCase();

            const ts = m.created_at ?? m.createdAt ?? "";

            return (
              <div
                key={m.id ?? i}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                {/* Nama pengirim */}
                {!mine && (
                  <div className="text-xs text-gray-400 mb-1 ml-1">
                    {m.sender_name}
                  </div>
                )}

                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl
                  ${mine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {m.file_type?.startsWith("image/") && (
                    <img
                      src={m.file_url ?? ""}
                      className="w-40 h-40 object-cover rounded-xl mb-2"
                    />
                  )}

                  {m.message && (
                    <div className="text-sm leading-snug break-words">
                      {m.message}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-300 text-right">
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

        {/* UPLOAD PREVIEW (WHATSAPP STYLE) */}
        {uploadPreview && (
          <div className="px-4 pb-3 flex justify-center">
            <div className="relative w-32 h-32 bg-gray-800 rounded-xl overflow-hidden">

              <img
                src={uploadPreview.url}
                className="w-full h-full object-cover opacity-60"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-gray-500 border-t-blue-500 animate-spin"></div>
                <div className="absolute text-white font-semibold text-sm">
                  {uploadPreview.progress}%
                </div>
              </div>

            </div>
          </div>
        )}

        {/* INPUT AREA */}
        <div
          className="
            px-3 py-3 flex items-center gap-3 bg-gray-850 border-t border-gray-700
            sticky bottom-0 pb-[env(safe-area-inset-bottom)]
          "
        >
          {/* Upload menu */}
          <div className="relative">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="p-2 hover:bg-gray-700 rounded-full text-white"
            >
              <Plus />
            </button>

            {showUpload && (
              <div className="absolute bottom-12 left-0 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm">
                  <ImageIcon size={18} /> Upload Gambar
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files && uploadFile(e.target.files[0])
                    }
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
            className="flex-1 px-4 py-3 bg-gray-800 rounded-xl text-white outline-none border border-gray-700 text-base"
          />

          <button
            onClick={sendMessage}
            className="p-3 bg-blue-600 rounded-full text-white flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
