"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastLogin, setLastLogin] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }

    setIsAuthorized(true);

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Gagal ambil data user");
        const data = await res.json();
        setUsers(data);
      } catch {
        toast.error("Gagal memuat data user ❌");
      }
    };

    fetchUsers();

    const now = new Date();
    const formatted = now.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastLogin(formatted);
  }, [router, API_URL]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.replace("/login");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthorized === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Checking authorization...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
        </p>

        {/* Daftar Pengguna */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Daftar Pengguna</h2>

        {/* Cari Pengguna */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ backgroundColor: "#F5F5F5" }} // Background input lebih terang
          />
          <p className="text-gray-600">
            Total Pengguna: <span className="font-semibold">{users.length}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg text-gray-800">
            <thead className="bg-gray-100 text-gray-900">
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Created At</th>
                <th className="px-4 py-2 border">Phone</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="text-center text-gray-800 hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-2 border">{user.id}</td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.username}</td>
                  <td className="px-4 py-2 border">
                    {user.role === "admin" ? (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm">
                        admin
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm">
                        user
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
                  <td className="px-4 py-2 border">{user.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
