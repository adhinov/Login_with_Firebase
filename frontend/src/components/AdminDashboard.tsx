"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data (simulasi API response)
  useEffect(() => {
    const dummyData: User[] = [
      {
        id: 1,
        email: "admin@example.com",
        username: "Admin User",
        role: "admin",
        created_at: "2025-09-20T10:30:00Z",
        phone: "+6281234567890",
      },
      {
        id: 2,
        email: "johndoe@example.com",
        username: "John Doe",
        role: "user",
        created_at: "2025-09-22T15:45:00Z",
        phone: "+6289876543210",
      },
      {
        id: 3,
        email: "janedoe@example.com",
        username: "Jane Doe",
        role: "user",
        created_at: "2025-09-25T09:20:00Z",
        phone: "+628111223344",
      },
    ];
    setUsers(dummyData);
  }, []);

  // Filter user berdasarkan pencarian
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-4">
          {/* Search Bar */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari Pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-1/3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    ID
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Email
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Username
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Role
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Created At
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } text-gray-800`}
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {user.id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.email}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.username}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-red-500 text-white"
                            : "bg-blue-500 text-white"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total pengguna */}
          <div className="mt-4 text-sm text-gray-700">
            Total Pengguna :{" "}
            <span className="font-semibold">{filteredUsers.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
