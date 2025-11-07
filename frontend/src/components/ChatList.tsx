"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
}

interface ChatListProps {
  onSelect: (user: User) => void;
}

export default function ChatList({ onSelect }: ChatListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://login-app-production-7f54.up.railway.app/api/users/chat-users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUsers(response.data);
      } catch (err) {
        console.error("Gagal ambil users:", err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-1/4 bg-white border-r overflow-y-auto">
      <h2 className="text-lg font-semibold p-3 border-b">Daftar User</h2>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="block w-full text-left px-3 py-2 hover:bg-blue-100"
        >
          {user.email}
        </button>
      ))}
    </div>
  );
}
