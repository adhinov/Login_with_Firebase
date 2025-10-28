"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedLogin = localStorage.getItem("lastLogin");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedLogin) setLastLogin(storedLogin);

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => {
        console.error(err);
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/login");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white text-gray-900 rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Logout
          </Button>
        </div>

        <p className="text-gray-700 font-medium mb-4">
          Last Login (Anda):{" "}
          <span className="text-blue-600">{lastLogin || "-"}</span>
        </p>

        <hr className="border-gray-300 mb-5" />

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-blue-700">
            Data Pengguna ({filteredUsers.length})
          </h2>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
          >
            Refresh
          </Button>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Cari berdasarkan email atau username..."
          className="w-full mb-5 px-4 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-md text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">ID</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Username</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Role</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Created At</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-100 transition-colors duration-100"
                >
                  <td className="border border-gray-300 px-3 py-2">{u.id}</td>
                  <td className="border border-gray-300 px-3 py-2 text-blue-700 font-medium">
                    {u.email}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {u.username || "-"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === "ADMIN"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {new Date(u.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {u.phone || "-"}
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
