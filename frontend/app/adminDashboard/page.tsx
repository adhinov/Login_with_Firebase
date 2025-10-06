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
  phone_number?: string | null;
  phone?: string | null;
  last_login?: string | null;
}

// Formatter Asia/Jakarta UTC+7, dengan jam & menit
const formatDateTimeJakarta = (dateString: string): string => {
  if (!dateString) return "-";
  // Pastikan dateString adalah ISO UTC string (misal: "2025-10-06T09:48:42.607Z")
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
};

const formatDateOnlyJakarta = (dateString: string): string => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Cek otorisasi admin
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;

    let isAdmin = false;
    let lastLoginValue = "Belum ada data";

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "admin") {
          isAdmin = true;
          if (parsedUser.last_login) {
            // Format ke waktu Jakarta dari ISO UTC
            lastLoginValue = formatDateTimeJakarta(parsedUser.last_login);
          }
        }
      } catch (err) {
        console.error("❌ Gagal parse user dari localStorage", err);
      }
    }

    // Jika tidak ada token atau bukan admin, redirect ke login
    if (!token || !isAdmin) {
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }

    setIsAuthorized(true);
    setLastLogin(lastLoginValue);

    // Fetch daftar user
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
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthorized === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-200">
        <p className="text-gray-600">Checking authorization...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-500 p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-fit max-w-full mx-auto">
        {/* Judul */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
        </p>

        {/* Daftar Pengguna */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Data Pengguna
        </h2>

        {/* Pencarian */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 w-64 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="table-auto border border-gray-200 rounded-lg text-gray-800 text-xs">
            <thead className="bg-gray-300 text-gray-900">
              <tr>
                <th className="px-2 py-1 border w-12">ID</th>
                <th className="px-2 py-1 border w-48">Email</th>
                <th className="px-2 py-1 border w-32">Username</th>
                <th className="px-2 py-1 border w-20">Role</th>
                <th className="px-2 py-1 border w-32">Created At</th>
                <th className="px-2 py-1 border w-32">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`text-center ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-2 py-1 border">{user.id}</td>
                  <td className="px-2 py-1 border text-left">{user.email}</td>
                  <td className="px-2 py-1 border text-left">{user.username}</td>
                  <td className="px-2 py-1 border">
                    {user.role === "admin" ? (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        admin
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        user
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1 border">
                    {formatDateOnlyJakarta(user.created_at)}
                  </td>
                  <td className="px-2 py-1 border">
                    {user.phone_number || user.phone || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer bawah tabel */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-gray-700 font-medium text-sm">
            Total Pengguna: {filteredUsers.length}
          </p>
          <div className="space-x-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition text-sm"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}