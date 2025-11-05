"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

interface Message {
  id?: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  message: string;
  created_at?: string;
  file_url?: string | null;
  file_type?: string | null;
}

interface OnlineUser {
  userId: number | string;
  username: string;
  socketId?: string;
}

const BACKEND =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export default function Chat() {
  const [socket, setSocket] = useState<any>(null); // keep as any for widest compatibility
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [receiverId, setReceiverId] = useState<number | string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!user) return;

    // CAST options to `any` to avoid TS ConnectOpts complaints (keeps runtime behavior)
    const s = io(
      BACKEND,
      ({ transports: ["websocket"], withCredentials: true } as any)
    );

    setSocket(s);

    s.on("connect", () => console.log("✅ socket connected:", s.id));
    s.on("disconnect", (reason: any) =>
      console.warn("⚠️ socket disconnected:", reason)
    );

    s.emit("join", { userId: user.id, username: user.username });

    s.on("updateOnlineUsers", (users: any[]) => {
      const normalized = users.map((u) => ({
        userId: u.userId ?? u.id,
        username: u.username,
        socketId: u.socketId,
      }));
      setOnlineUsers(
        normalized.filter((u) => String(u.userId) !== String(user.id))
      );
    });

    s.on("receiveMessage", (msg: Message) => {
      if (
        receiverId === null ||
        !user ||
        !(
          (String(msg.sender_id) === String(user.id) &&
            String(msg.receiver_id) === String(receiverId)) ||
          (String(msg.sender_id) === String(receiverId) &&
            String(msg.receiver_id) === String(user.id))
        )
      ) {
        return;
      }
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, receiverId]);

  useEffect(() => {
    if (!receiverId || !user || !token) return;
    (async () => {
      try {
        const res = await axios.get(
          `${BACKEND}/api/messages/${user.id}/${receiverId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data?.success) setMessages(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    })();
  }, [receiverId, user, token]);

  const sendMessage = async () => {
    if (!input.trim() || !receiverId || !token || !user) return;

    try {
      const res = await axios.post(
        `${BACKEND}/api/messages/upload`,
        { message: input.trim(), receiver_id: receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        const savedMsg: Message = res.data.data;
        setMessages((prev) => [...prev, savedMsg]);
        socket?.emit("sendMessage", savedMsg);
        setInput("");
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar user online */}
      <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Online Users</h2>
        {onlineUsers.map((u) => (
          <button
            key={String(u.userId)}
            onClick={() => setReceiverId(u.userId)}
            className={`block w-full text-left px-3 py-2 rounded mb-2 transition ${
              String(receiverId) === String(u.userId)
                ? "bg-lime-500 text-black"
                : "bg-gray-800 hover:bg-gray-700 text-gray-200"
            }`}
          >
            {u.username}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {receiverId
              ? `Chat dengan ${
                  onlineUsers.find(
                    (x) => String(x.userId) === String(receiverId)
                  )?.username ?? "User"
                }`
              : "Pilih user untuk mulai chat"}
          </h2>
          <div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="text-gray-400 hover:text-lime-400"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Isi pesan */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => {
            const mine = user && String(msg.sender_id) === String(user.id);
            return (
              <div
                key={i}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-xl ${
                    mine ? "bg-lime-500 text-black" : "bg-gray-700 text-white"
                  }`}
                >
                  {msg.message}
                  <div className="text-[10px] text-gray-300 mt-1 text-right">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input pesan */}
        {receiverId && (
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 outline-none"
              placeholder="Ketik pesan..."
            />
            <button
              onClick={sendMessage}
              className="bg-lime-500 text-black font-semibold px-4 rounded-lg hover:bg-lime-400 transition"
            >
              Kirim
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
