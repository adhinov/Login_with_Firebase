"use client";

import { useEffect, useRef, useState } from "react";
// Using default import + ts-ignore to avoid "no exported member 'io'" across versions
// @ts-ignore
import io from "socket.io-client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Message {
  sender_name: string;
  message: string;
  created_at?: string;
}

interface OnlineUser {
  userId: number;
  username: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [input, setInput] = useState("");
  // use ReturnType<typeof io> so TS treats the socket type correctly without importing Socket
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  useEffect(() => {
    if (!API_URL || !user?.id) return;

    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join", { userId: user.id, username: user.username });

    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("updateOnlineUsers", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on("connect", () => {
      console.log("socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [API_URL, user?.id, user?.username]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !user?.id) return;

    const msg = {
      sender_id: user.id,
      sender_name: user.username,
      message: input.trim(),
      created_at: new Date().toISOString(),
    };

    socketRef.current.emit("sendMessage", msg);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <Card className="w-full max-w-[600px] h-[85vh] flex flex-col bg-gray-900 border border-gray-800 shadow-2xl">
        <CardHeader className="flex flex-col gap-1 border-b border-gray-800 py-3 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-lime-300">
              Chat Room 💬 — {user?.username || "Guest"}
            </CardTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-gray-900 text-white border border-gray-700">
                <DropdownMenuItem onClick={handleEditProfile}>✏️ Edit Profile</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleLogout}>🚪 Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center text-gray-400 text-sm gap-1 mt-1">
            <Users className="w-4 h-4 text-lime-400" />
            <span>
              {onlineUsers.length} online
              {onlineUsers.length > 0 && (
                <span className="text-gray-500 ml-1">
                  (
                  {onlineUsers
                    .map((u) => u.username)
                    .slice(0, 3)
                    .join(", ")}
                  {onlineUsers.length > 3 ? ", ..." : ""}
                  )
                </span>
              )}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender_name === user.username ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${msg.sender_name === user.username ? "bg-lime-500 text-black" : "bg-gray-800 text-gray-100"}`}>
                <p className="font-semibold text-xs mb-1">{msg.sender_name}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>

        <CardFooter className="border-t border-gray-800 p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
            placeholder="Ketik pesan..."
          />
          <Button onClick={sendMessage} className="rounded-full px-6 bg-lime-500 hover:bg-lime-400 text-black">
            Send
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
