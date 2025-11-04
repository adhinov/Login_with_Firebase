"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import io from "socket.io-client";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Users,
  Send,
  Paperclip,
  Image,
  FileVideo,
  FileText,
  Mic,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Message {
  sender_id: number;
  sender_name: string;
  receiver_id?: number;
  message: string;
  file_url?: string;
  file_type?: string;
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
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Ambil user dan token
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://beneficial-fulfillment-production-ad1b.up.railway.app";

  // ID penerima sementara (contoh: user 17)
  const RECEIVER_ID = 17;

  // Socket.io setup
  useEffect(() => {
    if (!API_URL || !user?.id) return;

    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join", { userId: user.id, username: user.username });

    socket.on("receiveMessage", (msg: Message) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on("updateOnlineUsers", (users: OnlineUser[]) =>
      setOnlineUsers(users)
    );
    socket.on("connect", () => console.log("✅ socket connected:", socket.id));
    socket.on("disconnect", () => console.log("❌ socket disconnected"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [API_URL, user?.id, user?.username]);

  // Auto-scroll ke bawah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kirim pesan teks
  const sendMessage = async () => {
    if (!input.trim() || !token) return;

    try {
      const res = await axios.post(
        `${API_URL}/api/messages/upload`,
        {
          message: input.trim(),
          receiver_id: RECEIVER_ID,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        socketRef.current?.emit("sendMessage", res.data.data);
        setMessages((prev) => [...prev, res.data.data]);
        setInput("");
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  // Kirim pesan + file
  const handleFileUpload = async (file: File, type: string) => {
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", input || ""); // opsional
      formData.append("receiver_id", RECEIVER_ID.toString());

      const res = await axios.post(
        `${API_URL}/api/messages/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        socketRef.current?.emit("sendMessage", res.data.data);
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error("❌ Upload file error:", err);
    }
  };

  // Rekam suara
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        await handleFileUpload(file, "audio");
      };

      recorder.start();
      setRecording(true);
      setMediaRecorder(recorder);
    } catch (err) {
      alert("Mic tidak dapat diakses");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Card className="w-full h-[100vh] sm:h-[85vh] sm:max-w-[600px] flex flex-col bg-gray-900 border border-gray-800 shadow-2xl rounded-none sm:rounded-2xl">
        {/* HEADER */}
        <CardHeader className="flex flex-col gap-1 border-b border-gray-800 py-3 px-4 bg-gray-900 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-lime-300 truncate max-w-[75%]">
              Chat Room 💬 — {user?.username || "Guest"}
            </CardTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-gray-900 text-white border border-gray-700"
              >
                <DropdownMenuItem onClick={handleEditProfile}>
                  ✏️ Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  🚪 Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center text-gray-400 text-sm gap-1 mt-1">
            <Users className="w-4 h-4 text-lime-400" />
            <span>
              {onlineUsers.length} online{" "}
              {onlineUsers.length > 0 && (
                <span className="text-gray-500 ml-1">
                  (
                  {onlineUsers
                    .map((u) => u.username)
                    .slice(0, 3)
                    .join(", ")}
                  {onlineUsers.length > 3 ? ", ..." : ""})
                </span>
              )}
            </span>
          </div>
        </CardHeader>

        {/* CHAT LIST */}
        <CardContent className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-900">
          {messages.map((msg, i) => {
            const mine = msg.sender_id === user.id;
            return (
              <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-lime-500 text-black" : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <p className="font-semibold text-xs mb-1">{msg.sender_name}</p>
                  {msg.file_url ? (
                    msg.file_type?.includes("image") ? (
                      <img src={msg.file_url} alt="upload" className="rounded-lg max-w-[200px]" />
                    ) : msg.file_type?.includes("video") ? (
                      <video src={msg.file_url} controls className="rounded-lg max-w-[200px]" />
                    ) : msg.file_type?.includes("audio") ? (
                      <audio src={msg.file_url} controls />
                    ) : (
                      <a
                        href={msg.file_url}
                        download
                        className="underline text-blue-300"
                      >
                        📄 File
                      </a>
                    )
                  ) : (
                    <p className="break-words">{msg.message}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>

        {/* INPUT */}
        <CardFooter className="border-t border-gray-800 p-3 flex items-center gap-2 bg-gray-900 sticky bottom-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 text-white border border-gray-700">
              <label className="cursor-pointer px-3 py-2 flex items-center gap-2 hover:bg-gray-800">
                <Image className="w-4 h-4 text-lime-400" /> Gambar
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files[0], "image")
                  }
                />
              </label>
              <label className="cursor-pointer px-3 py-2 flex items-center gap-2 hover:bg-gray-800">
                <FileVideo className="w-4 h-4 text-lime-400" /> Video
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files[0], "video")
                  }
                />
              </label>
              <label className="cursor-pointer px-3 py-2 flex items-center gap-2 hover:bg-gray-800">
                <FileText className="w-4 h-4 text-lime-400" /> Dokumen
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files[0], "file")
                  }
                />
              </label>
              <DropdownMenuItem
                onClick={recording ? stopRecording : startRecording}
                className="cursor-pointer flex items-center gap-2 hover:bg-gray-800"
              >
                <Mic
                  className={`w-4 h-4 ${
                    recording ? "text-red-400" : "text-lime-400"
                  }`}
                />
                {recording ? "Stop Rekam" : "Rekam Suara"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
            placeholder="Ketik pesan..."
          />
          <Button
            onClick={sendMessage}
            className="rounded-full p-3 bg-lime-500 hover:bg-lime-400 text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
