"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Message {
  id?: number;
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
  const [users, setUsers] = useState<User[]>([]);
  const sender_id = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Ambil daftar user
  useEffect(() => {
    if (!token) return;
    axios
      .get("https://login-app-production-7f54.up.railway.app/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => console.error("❌ Error get users:", err));
  }, [token]);

  // Ambil pesan antara user aktif dan receiver
  useEffect(() => {
    if (!receiver || !sender_id) return;

    axios
      .get(
        `https://login-app-production-7f54.up.railway.app/api/messages/${sender_id}/${receiver.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => console.error("❌ Error get messages:", err));
  }, [receiver, sender_id, token]);

  // Kirim pesan baru
  const sendMessage = async () => {
    if (!input.trim() || !receiver || !sender_id) return;

    const newMsg = {
      sender_id,
      receiver_id: receiver.id,
      message: input.trim(),
    };

    try {
      const res = await axios.post(
        "https://login-app-production-7f54.up.railway.app/api/messages/upload",
        newMsg,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) => [...prev, res.data]);
      setInput("");
    } catch (err) {
      console.error("❌ Error send message:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar kiri: daftar user */}
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 text-lg font-semibold border-b">Daftar User</div>
        <div>
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setReceiver(u)}
              className={`p-3 cursor-pointer hover:bg-blue-100 ${
                receiver?.id === u.id ? "bg-blue-50" : ""
              }`}
            >
              {u.email}
            </div>
          ))}
        </div>
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
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex mb-3 ${
                    msg.sender_id === sender_id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
                      msg.sender_id === sender_id
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
