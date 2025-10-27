"use client";

import { useEffect, useState } from "react";

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

const formatDateTimeJakarta = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return (
      new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(d) + " WIB"
    );
  } catch {
    return dateString || "-";
  }
};

const formatDateOnlyJakarta = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString || "-";
  }
};

const useMockAuthAndFetch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const redirect = (path: string) => {
    if (typeof window !== "undefined") {
      window.location.replace(path);
    }
  };

  useEffect(() => {
    const MOCK_IS_ADMIN = true;
    const MOCK_LAST_LOGIN = new Date().toISOString();

    if (!MOCK_IS_ADMIN) {
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
    setLastLogin(formatDateTimeJakarta(MOCK_LAST_LOGIN));

    const fetchMockUsers = async () => {
      const data = [
        { id: 1, email: "admin@example.com", username: "Administrator", role: "admin", created_at: new Date().toISOString(), phone_number: "-" },
        { id: 2, email: "budi@gmail.com", username: "Budi Santoso", role: "user", created_at: new Date().toISOString(), phone_number: "081234567890" },
      ];
      setUsers(data);
    };

    fetchMockUsers();
  }, []);

  return { users, lastLogin, isAuthorized, fetchUsers: () => window.location.reload(), redirect };
};

export default function AdminDashboard() {
  const { users, lastLogin, isAuthorized, fetchUsers, redirect } = useMockAuthAndFetch();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleLogout = () => redirect("/login");
  const handleRefresh = () => fetchUsers();

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthorized === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Checking authorization...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-900 py-10 px-4">
      {/* ✅ Card putih tengah dengan lebar lebih kecil */}
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-6 sm:p-8 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 sm:mb-0 text-center sm:text-left">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition duration-150"
          >
            Logout
          </button>
        </div>

        <p className="text-gray-600 mb-6 border-b pb-3 text-center sm:text-left">
          <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
        </p>

        {/* Section data pengguna */}
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center sm:text-left">
          Data Pengguna ({filteredUsers.length})
        </h2>

        {/* Input pencarian */}
        <div className="mb-6 flex justify-center sm:justify-start">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-xl px-4 py-2 w-full sm:w-2/3 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* ✅ Pembungkus tabel agar responsif dan tidak buat card melebar */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg text-sm text-gray-800">
            <thead className="bg-gray-700 text-white">
              <tr className="text-left uppercase text-xs tracking-wider">
                <th className="px-4 py-3 border text-center">ID</th>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Username</th>
                <th className="px-4 py-3 border text-center">Role</th>
                <th className="px-4 py-3 border">Created At</th>
                <th className="px-4 py-3 border">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-blue-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } transition`}
                  >
                    <td className="px-4 py-3 border text-center font-medium">{user.id}</td>
                    <td className="px-4 py-3 border break-all">{user.email}</td>
                    <td className="px-4 py-3 border break-all">{user.username}</td>
                    <td className="px-4 py-3 border text-center">
                      {user.role === "admin" ? (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 border">
                      {formatDateOnlyJakarta(user.created_at)}
                    </td>
                    <td className="px-4 py-3 border">
                      {user.phone_number || user.phone || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t gap-3">
          <p className="text-gray-700 font-medium">
            Total Pengguna:{" "}
            <span className="font-bold text-gray-900">{filteredUsers.length}</span>
          </p>
          <button
            onClick={handleRefresh}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition duration-150"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </main>
  );
}
