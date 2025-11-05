"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface Message {
  sender_id?: string;
  receiver_id?: string;
  message: string;
  created_at?: string;
  file_url?: string | null;
  file_type?: string | null;
}

// gunakan any agar tidak ada error tipe
let socket: any;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ganti dengan id user yang login (ambil dari localStorage/auth)
  const currentUserId = "1";
  const receiverId = "2";

  useEffect(() => {
    // Hapus `withCredentials` — ini yang menyebabkan error TypeScript
    socket = io("https://login-app-production-7f54.up.railway.app", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);

      // kirim info join (sesuaikan payload dengan server)
      socket.emit("join", { userId: currentUserId, username: `User${currentUserId}` });
    });

    socket.on("disconnect", (reason: any) => {
      console.warn("⚠️ Socket disconnected:", reason);
      setConnected(false);
    });

    // terima pesan realtime dari server
    socket.on("receiveMessage", (data: Message) => {
      console.log("📩 Received:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autoscroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || input.trim() === "") return;

    const newMessage: Message = {
      sender_id: currentUserId,
      receiver_id: receiverId,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    // emit sesuai event server kamu (sendMessage)
    socket.emit("sendMessage", newMessage);

    // tampilkan di UI pengirim langsung
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="p-4 max-w-lg mx-auto border rounded-2xl bg-white shadow-md">
      <h2 className={`text-center text-lg font-semibold mb-3 ${connected ? "text-green-600" : "text-red-500"}`}>
        {connected ? "🟢 Connected to Chat" : "🔴 Disconnected"}
      </h2>

      <div className="h-96 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
        {messages.length === 0 && <p className="text-gray-400 text-center mt-32">Belum ada pesan, mulai chat sekarang 💬</p>}

        {messages.map((msg, i) => (
          <div key={i} className={`flex mb-2 ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] p-2 px-3 rounded-2xl text-sm shadow-sm ${msg.sender_id === currentUserId ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-200 text-gray-900 rounded-bl-none"}`}>
              {msg.message}
              <div className="text-[10px] text-gray-300 mt-1 text-right">
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
          className="flex-grow p-2 border rounded-l-lg focus:outline-none text-gray-900 bg-white"
        />
        <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-r-lg">
          Kirim
        </button>
      </div>
    </div>
  );
}
