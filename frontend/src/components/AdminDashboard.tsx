"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone_number?: string; // sesuaikan dengan DB
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`
      );
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Ambil last login dari localStorage
    const loginTime = localStorage.getItem("lastLogin");
    if (loginTime) setLastLogin(new Date(loginTime).toLocaleString("id-ID"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold mb-2">Dashboard Admin</h1>
      <p className="text-sm text-gray-600 mb-6">
        Last Login (Anda):{" "}
        <span className="font-medium text-gray-800">{lastLogin || "-"}</span>
      </p>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari pengguna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 px-3 py-2 border rounded-md text-gray-800 placeholder-gray-400 text-sm"
        />
      </div>

      {/* Card Table */}
      <div className="bg-gray-200 shadow-lg rounded-lg p-6 w-fit mx-auto">
        <h2 className="text-lg font-semibold mb-4">Data Pengguna</h2>

        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-gray-300 px-2 py-1 text-left">ID</th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Email
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Username
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Role
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Created At
                </th>
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="bg-white hover:bg-gray-100">
                  <td className="border border-gray-300 px-2 py-1">
                    {user.id}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {user.email}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {user.username}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {user.role === "admin" ? (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                        admin
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                        user
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {user.phone_number || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm font-medium">
            Total Pengguna: {filteredUsers.length}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={fetchUsers}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
