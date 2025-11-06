"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ChatList from "./ChatList";

interface Message {
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: string;
}

interface User {
  id: string;
  email: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState<User | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!userId || !token) return;

    socketRef.current = io("https://login-app-production-7f54.up.railway.app", {
      transports: ["websocket"],
      query: { token, userId },
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("receiveMessage", (data: Message) => {
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

    socketRef.current?.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* daftar user */}
      <ChatList onSelect={setReceiver} />

      {/* area chat */}
      <div className="flex flex-col flex-1">
        {receiver ? (
          <>
            <div className="p-3 bg-blue-500 text-white font-semibold">
              Chat dengan {receiver.email}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                    className={`p-2 rounded-lg max-w-[70%] ${
                      msg.sender_id === localStorage.getItem("userId")
                        ? "bg-blue-500 text-white ml-auto"
                        : "bg-white text-black"
                    }`}
                  >
                    {msg.message}
                    <div className="text-xs text-gray-600 mt-1">
                      {msg.created_at &&
                        new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center p-3 border-t bg-white">
              <input
                className="flex-1 p-2 border rounded-md bg-white text-black"
                placeholder="Ketik pesan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                onClick={sendMessage}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
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
