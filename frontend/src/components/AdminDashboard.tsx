"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone_number?: string;
}

// ✅ Formatter waktu Asia/Jakarta
const formatToJakarta = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();

    const loginTime = localStorage.getItem("lastLogin");
    if (loginTime) setLastLogin(formatToJakarta(loginTime));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("lastLogin");
    window.location.href = "/login";
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 text-gray-800">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-sm text-gray-600">
          Last Login (Anda):{" "}
          <span className="font-medium text-gray-800">{lastLogin || "-"}</span>
        </p>
      </div>

      {/* Search */}
      <div className="mb-5 w-full max-w-md">
        <input
          type="text"
          placeholder="Cari pengguna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Tabel Container */}
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-5xl p-6">
        <h2 className="text-lg font-semibold mb-4">Data Pengguna</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm text-left">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="border border-gray-300 px-3 py-2">ID</th>
                <th className="border border-gray-300 px-3 py-2">Email</th>
                <th className="border border-gray-300 px-3 py-2">Username</th>
                <th className="border border-gray-300 px-3 py-2">Role</th>
                <th className="border border-gray-300 px-3 py-2">Created At</th>
                <th className="border border-gray-300 px-3 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{user.id}</td>
                    <td className="border border-gray-300 px-3 py-2">{user.email}</td>
                    <td className="border border-gray-300 px-3 py-2">{user.username}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {user.role === "admin" ? (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          admin
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          user
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {formatToJakarta(user.created_at)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {user.phone_number || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-4 text-gray-500 italic"
                  >
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-3">
          <span className="text-sm font-medium">
            Total Pengguna: {filteredUsers.length}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
