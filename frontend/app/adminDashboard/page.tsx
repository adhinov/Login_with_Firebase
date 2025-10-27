"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone_number?: string | null;
  last_login?: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

const formatDateJakarta = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(d) + " WIB";
  } catch {
    return dateString || "-";
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("Memuat...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== "admin") {
      router.replace("/login");
      return;
    }

    setLastLogin(formatDateJakarta(user.last_login));

    fetch(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data pengguna.");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-800 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Logout
        </button>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
          <p className="text-gray-600 text-sm mb-6">
            <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
          </p>

          {/* Pencarian */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Data Pengguna ({filteredUsers.length})
            </h2>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
            >
              Refresh
            </button>
          </div>

          <input
            type="text"
            placeholder="Cari berdasarkan email atau username..."
            className="w-full mb-6 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Tabel */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full border-collapse text-sm text-gray-800">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="p-3 border-r border-gray-600 text-center">ID</th>
                  <th className="p-3 border-r border-gray-600 text-left">Email</th>
                  <th className="p-3 border-r border-gray-600 text-left">Username</th>
                  <th className="p-3 border-r border-gray-600 text-center">Role</th>
                  <th className="p-3 border-r border-gray-600 text-center">Created At</th>
                  <th className="p-3 text-center">Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-gray-500 italic"
                    >
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition`}
                    >
                      <td className="p-3 text-center font-medium">{user.id}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.username}</td>
                      <td className="p-3 text-center">
                        {user.role === "admin" ? (
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {formatDateJakarta(user.created_at)}
                      </td>
                      <td className="p-3 text-center">
                        {user.phone_number || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-gray-500 italic"
                    >
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            Total Pengguna: <span className="font-bold">{users.length}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-3 text-sm">
        © {new Date().getFullYear()} Login App — Admin Dashboard
      </footer>
    </div>
  );
}
