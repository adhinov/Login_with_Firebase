"use client";

import { useEffect, useRef, useState } from "react";
import socket from "@/lib/socket";
import axios from "axios";
import { Plus, Send, LogOut } from "lucide-react";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadMenu, setUploadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const userName =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "User"
      : "User";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://login-app-production-7f54.up.railway.app";

  //===============================
  // AUTO SCROLL – SAAT PERTAMA MASUK
  //===============================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  //===============================
  // FETCH PESAN AWAL
  //===============================
  useEffect(() => {
    axios
      .get(`${API_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data);
        setTimeout(
          () =>
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" }),
          50
        );
      })
      .catch((err) => console.error("Fetch messages error:", err));
  }, []);

  //===============================
  // SOCKET LISTENER
  //===============================
  useEffect(() => {
    socket.on("receive_message", (msg: Message) => {
      setMessages((prev: Message[]) => [...prev, msg]);

      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  //===============================
  // KIRIM PESAN TEXT
  //===============================
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      await axios.post(
        `${API_URL}/api/messages/upload`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInput("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  //===============================
  // UPLOAD FILE
  //===============================
  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("message", "");

    try {
      await axios.post(`${API_URL}/api/messages/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  //===============================
  // LOGOUT
  //===============================
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white relative">

      {/* =======================
          HEADER (STICKY ALWAYS)
      ======================== */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1e293b] shadow-lg p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Global Chat Room</h1>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 bg-[#334155] rounded-full"
          >
            <LogOut size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-[#334155] rounded-md shadow-lg text-sm p-2">
              <button
                onClick={handleLogout}
                className="w-full text-left p-2 hover:bg-[#475569] rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================
          MESSAGE LIST
      ================= */}
      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-28">
        {messages?.map((msg) => {
          const isMe = msg.sender_name === userName;

          return (
            <div
              key={msg.id}
              className={`mb-4 flex flex-col ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              <span
                className={`text-xs mb-1 ${
                  isMe ? "text-yellow-300" : "text-green-300"
                }`}
              >
                {msg.sender_name}
              </span>

              {/* Pesan teks atau file */}
              <div
                className={`max-w-xs p-3 rounded-2xl ${
                  isMe ? "bg-blue-600" : "bg-[#334155]"
                }`}
              >
                {msg.file_url ? (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    className="underline text-sm"
                  >
                    Klik untuk Download
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                )}
              </div>

              <span className="text-[10px] mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* =======================
          INPUT BAR – SAFE AREA FIX
      ======================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e293b] p-3 pb-[env(safe-area-inset-bottom)] flex items-center gap-2 shadow-lg">

        {/* BUTTON + (DROPDOWN) */}
        <div className="relative">
          <button
            onClick={() => setUploadMenu((prev) => !prev)}
            className="p-3 bg-[#334155] rounded-full"
          >
            <Plus size={20} />
          </button>

          {uploadMenu && (
            <div className="absolute bottom-12 left-0 bg-[#334155] p-2 rounded shadow-lg">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="block px-3 py-2 hover:bg-[#475569] rounded"
              >
                Upload Gambar
              </button>
            </div>
          )}
        </div>

        {/* INPUT */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
          className="flex-1 p-3 rounded-full bg-[#334155] focus:outline-none"
        />

        {/* SEND BUTTON */}
        <button
          onClick={sendMessage}
          className="p-3 bg-blue-600 rounded-full"
        >
          <Send size={20} />
        </button>

        {/* HIDDEN FILE INPUT */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
}
