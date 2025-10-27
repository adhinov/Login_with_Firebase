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

    // waktu login terakhir
    const now = new Date();
    const formatted = now.toLocaleString("id-ID", {
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-gray-800 text-white px-8 py-5 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          Logout
        </Button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full bg-white px-10 py-8">
        <p className="text-gray-600 mb-4">
          <strong>Last Login (Anda):</strong> {lastLogin}
        </p>
        <hr className="mb-6 border-gray-300" />

        <div className="flex flex-col w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Data Pengguna ({users.length})
          </h2>

          <input
            type="text"
            placeholder="Cari pengguna..."
            className="w-full mb-4 p-3 border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
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
                    <td className="p-3 border text-gray-800">{user.id}</td>
                    <td className="p-3 border text-gray-800">{user.email}</td>
                    <td className="p-3 border text-gray-800">{user.username}</td>
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
                    <td className="p-3 border text-gray-800">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 border text-gray-800">
                      {user.phone || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white text-center py-3 text-sm">
        © {new Date().getFullYear()} Login App — Admin Dashboard
      </footer>
    </div>
  );
}
