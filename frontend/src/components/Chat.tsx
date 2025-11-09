"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

interface Message {
  id?: number;
  sender?: string;
  message: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // gunakan NEXT_PUBLIC_API_URL (Next.js)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // ambil pesan awal dan (opsional) polling sederhana
  useEffect(() => {
    if (!API_URL) {
      console.warn("NEXT_PUBLIC_API_URL belum diset");
      return;
    }

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        // asumsi backend mengembalikan array pesan
        setMessages(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch (err) {
        console.error("Gagal ambil pesan:", err);
      }
    };

    fetchMessages();
    const poll = setInterval(fetchMessages, 3000); // polling 3s (opsional)
    return () => clearInterval(poll);
  }, [API_URL]);

  // scroll otomatis
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!API_URL) {
      alert("API URL belum diset (NEXT_PUBLIC_API_URL).");
      return;
    }

    const token = localStorage.getItem("token");
    const payload = {
      message: input.trim(),
      // jika backend butuh sender/receiver, sesuaikan payload
    };

    // optimistis update UI dulu
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "You", message: input.trim(), created_at: new Date().toISOString() },
    ]);
    setInput("");

    try {
      await axios.post(`${API_URL}/api/messages/upload`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      // backend akan disinkronkan oleh polling di useEffect
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  // dropdown actions
  const handleEditProfile = () => {
    setShowMenu(false);
    // arahkan ke halaman edit profile (ganti url sesuai rute kamu)
    window.location.href = "/edit-profile";
  };
  const handleClearChat = () => {
    setShowMenu(false);
    setMessages([]);
  };
  const handleLogout = () => {
    setShowMenu(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // simple gear SVG (bisa diganti)
  const GearIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 17.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82L3.41 4.7a2 2 0 1 1 2.83-2.83l.06.06c.5.5 1.2.7 1.82.33H10a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.31 1 1.51.62.35 1.32.17 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.5.5-.7 1.2-.33 1.82V10c.14.6.81 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.31.4-1.51 1z" />
    </svg>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-6">
      <div className="w-full max-w-3xl h-[80vh] bg-gray-900 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 w-9 h-9 rounded-full flex items-center justify-center font-semibold">A</div>
            <div>
              <div className="text-white font-semibold">Global Chat Room</div>
              <div className="text-xs text-gray-400">Saling ngobrol antar user</div>
            </div>
          </div>

          <div className="relative">
            <button
              aria-label="settings"
              className="p-2 rounded-full hover:bg-gray-700"
              onClick={() => setShowMenu((s) => !s)}
            >
              <GearIcon />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                <button onClick={handleEditProfile} className="w-full text-left px-4 py-2 hover:bg-gray-700">
                  Edit Profile
                </button>
                <button onClick={handleClearChat} className="w-full text-left px-4 py-2 hover:bg-gray-700">
                  Clear Chat
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* chat area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-800">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-8">Belum ada pesan</div>
          ) : (
            messages.map((m, i) => {
              const mine = (m.sender || "").toLowerCase().includes("you") || (localStorage.getItem("email") && (m as any).sender_email === localStorage.getItem("email"));
              return (
                <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${mine ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"}`}>
                    <div className="text-sm">{m.message}</div>
                    {m.created_at && <div className="text-[10px] text-gray-300 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* input */}
        <div className="px-6 py-4 bg-gray-800 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message here..."
            className="flex-1 rounded-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />
          <button onClick={sendMessage} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700">
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
