"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  sender: string;
  message: string;
  createdAt?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  useEffect(() => {
    if (!API_URL || !user?.id) return;

    const newSocket = io(API_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.emit("join", { userId: user.id, username: user.username });

    newSocket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [API_URL, user?.id]);

  // scroll ke bawah tiap pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "" || !socket) return;
    const msg = {
      sender_id: user.id,
      sender_name: user.username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };
    socket.emit("sendMessage", msg);
    setInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold">
          Chat Room 💬 — {user?.username || "Guest"}
        </h2>

        {/* ⚙️ Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-gray-900 text-white border-gray-700">
            <DropdownMenuItem onClick={handleEditProfile}>
              ✏️ Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={handleLogout}>
              🚪 Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === user.username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                msg.sender === user.username
                  ? "bg-lime-500 text-black"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <p className="font-semibold">{msg.sender}</p>
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="border-t border-gray-800 p-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-400"
          placeholder="Ketik pesan..."
        />
        <Button onClick={sendMessage} className="rounded-full px-6 bg-lime-500 hover:bg-lime-400">
          Send
        </Button>
      </div>
    </div>
  );
}
