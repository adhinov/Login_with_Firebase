// components/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface User {
  id: string;
  email: string;
}

interface ChatListProps {
  onSelect: (user: User) => void;
  selectedUser: User | null;
}

export default function ChatList({ onSelect, selectedUser }: ChatListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.warn("ChatList: no token found in localStorage");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await axios.get(
          "https://login-app-production-7f54.up.railway.app/api/users/chat-users",
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          }
        );

        // If your backend returns { success: true, data: [...] } adjust accordingly.
        // This code assumes the endpoint returns an array of users directly.
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setUsers(data);
      } catch (err) {
        console.error("❌ Gagal ambil users:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Memuat users...</div>;
  }

  if (users.length === 0) {
    return <div className="p-4 text-sm text-gray-500">Belum ada user</div>;
  }

  return (
    <div className="overflow-y-auto h-full">
      {users.map((user) => (
        <div
          key={user.id}
          onClick={() => onSelect(user)}
          className={`cursor-pointer px-4 py-3 border-b hover:bg-blue-50 transition flex items-center justify-between ${
            selectedUser?.id === user.id ? "bg-blue-100 font-medium" : ""
          }`}
        >
          <div className="truncate">{user.email}</div>
        </div>
      ))}
    </div>
  );
}
