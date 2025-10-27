"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
          setFilteredUsers(data.users);
        }
      })
      .catch((err) => console.error(err));

    const now = new Date();
    const formatted = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(now);
    setLastLogin(formatted);
  }, [router]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = users.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0c1b2a] flex justify-center py-12">
      {/* CARD UTAMA */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-6xl px-10 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <strong>Last Login (Anda):</strong> {lastLogin}
        </p>

        <hr className="my-4 border-gray-300" />

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Data Pengguna ({filteredUsers.length})
          </h2>
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg text-sm text-left">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Created At</th>
                <th className="px-4 py-2 border">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-100 transition duration-150"
                >
                  <td className="px-4 py-2 border">{user.id}</td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">
                    {user.username || "-"}
                  </td>
                  <td className="px-4 py-2 border">
                    {user.role === "admin" ? (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 border">
                    {user.phone || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
