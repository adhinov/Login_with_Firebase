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
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));

    // format tanggal login terakhir
    const now = new Date();
    const formatted = now.toLocaleString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastLogin(formatted);
  }, [router]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-7xl bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <p className="text-gray-500 mb-4">
          <strong>Last Login (Anda):</strong> {lastLogin}
        </p>

        <hr className="my-4 border-gray-300" />

        <h2 className="text-xl font-semibold mb-4">
          Data Pengguna ({users.length})
        </h2>

        <input
          type="text"
          placeholder="Cari pengguna..."
          className="w-full mb-4 p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Username</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Created At</th>
                <th className="p-3 border">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3 border">{user.id}</td>
                  <td className="p-3 border">{user.email}</td>
                  <td className="p-3 border">{user.username}</td>
                  <td className="p-3 border">
                    {user.role === "admin" ? (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="p-3 border">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 border">
                    {user.phone ? user.phone : "-"}
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
