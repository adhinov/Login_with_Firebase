"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client"; // ✅ versi lama pakai default import
import ChatList from "./ChatList";

interface Message {
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
  file_url?: string | null;
  file_type?: string | null;
}

interface User {
  id: string;
  email: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState<User | null>(null);
  const socketRef = useRef<any>(null); // ✅ pakai any supaya lint aman di semua versi

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!userId || !token) return;

    // ✅ koneksi socket
    socketRef.current = io("https://login-app-production-7f54.up.railway.app", {
      transports: ["websocket"],
      query: { token, userId },
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
      const username = localStorage.getItem("username") || "User";
      socketRef.current.emit("join", { userId, username });
    });

    socketRef.current.on("receiveMessage", (data: Message) => {
      console.log("📥 Pesan diterima:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    const sender_id = localStorage.getItem("userId");
    if (!input || !receiver || !sender_id) return;

    const messageData: Message = {
      sender_id,
      receiver_id: receiver.id,
      message: input,
      created_at: new Date().toISOString(),
    };

    console.log("📤 Mengirim pesan:", messageData);

    socketRef.current?.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar kiri: daftar user */}
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 text-lg font-semibold border-b">Daftar User</div>
        <ChatList onSelect={setReceiver} selectedUser={receiver} />
      </div>

      {/* Area chat kanan */}
      <div className="flex flex-col flex-1">
        {receiver ? (
          <>
            {/* Header chat */}
            <div className="p-4 bg-blue-600 text-white font-semibold shadow-sm">
              Chat dengan {receiver.email}
            </div>

            {/* Pesan */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              {messages
                .filter(
                  (m) =>
                    (m.sender_id === localStorage.getItem("userId") &&
                      m.receiver_id === receiver.id) ||
                    (m.sender_id === receiver.id &&
                      m.receiver_id === localStorage.getItem("userId"))
                )
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex mb-3 ${
                      msg.sender_id === localStorage.getItem("userId")
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
                        msg.sender_id === localStorage.getItem("userId")
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <div>{msg.message}</div>
                      <div className="text-[10px] text-gray-300 text-right mt-1">
                        {msg.created_at &&
                          new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Input pesan */}
            <div className="flex items-center p-3 border-t bg-white">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ketik pesan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="ml-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Kirim
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            Pilih user untuk memulai chat
          </div>
        )}
      </div>
    </div>
  );
}
