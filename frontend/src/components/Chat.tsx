"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

interface Message {
  id?: number | string;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at?: string;
  file_url?: string | null;
  file_type?: string | null;
}

interface OnlineUser {
  userId: number;
  username: string;
  socketId?: string;
}

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  "https://beneficial-fulfillment-production-ad1b.up.railway.app";

export default function Chat() {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const [user, setUser] = useState<{ id: number; username: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Ambil user & token dari localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.warn("Gagal parse user/token from localStorage", err);
    }
  }, []);

  // Setup socket.io (default import + keep socket as any => no TS errors)
  useEffect(() => {
    if (!user) return;

    const s = io(API_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.emit("join", { userId: user.id, username: user.username });

    s.on("connect", () => console.log("✅ socket connected:", s.id));
    s.on("disconnect", (reason: string) =>
      console.warn("⚠️ socket disconnected:", reason)
    );

    // update online users list (server emits array of { userId, username, socketId? })
    s.on("updateOnlineUsers", (users: OnlineUser[]) => {
      // remove self from list
      setOnlineUsers(users.filter((u) => u.userId !== user.id));
    });

    // receive message (server emits msg that already contains sender/receiver/etc)
    s.on("receiveMessage", (msg: Message) => {
      // only push to UI if message involves current opened conversation
      if (
        receiverId === null ||
        !user ||
        !(
          (msg.sender_id === user.id && msg.receiver_id === receiverId) ||
          (msg.sender_id === receiverId && msg.receiver_id === user.id)
        )
      ) {
        // message not for current opened chat — you may decide to show unread counters
        return;
      }
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, receiverId]); // note: socket reconnects when user/receiverId changes

  // Fetch history when receiverId selected
  useEffect(() => {
    if (!receiverId || !token || !user) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/messages/${user.id}/${receiverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          setMessages(res.data.data || []);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [receiverId, token, user]);

  // send message: use existing upload endpoint for consistency (stores + returns saved msg)
  const sendMessage = async () => {
    if (!input.trim() || !token || !user || !receiverId) return;

    try {
      const res = await axios.post(
        `${API_URL}/api/messages/upload`,
        {
          message: input.trim(),
          receiver_id: receiverId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        const savedMsg: Message = res.data.data;
        // add to local UI and notify server via socket
        setMessages((prev) => [...prev, savedMsg]);
        socket?.emit("sendMessage", savedMsg);
        setInput("");
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Online Users</h2>
        {onlineUsers.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada user lain online</p>
        )}
        {onlineUsers.map((u) => (
          <button
            key={u.userId}
            onClick={() => setReceiverId(u.userId)}
            className={`block w-full text-left px-3 py-2 rounded mb-2 transition ${
              receiverId === u.userId
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
                  onlineUsers.find((u) => u.userId === receiverId)?.username ||
                  "User"
                }`
              : "Pilih user untuk mulai chat"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => {
            const mine = user && msg.sender_id === user.id;
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

        {receiverId && (
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 outline-none"
              placeholder="Ketik pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
