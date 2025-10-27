"use client";

import { useEffect, useState } from "react";

// Simulasi useRouter dan toast untuk lingkungan Vercel/Immersive
const useRouter = () => ({
  replace: (path: string) => {
    if (typeof window !== "undefined") {
      window.location.replace(path);
    } else {
      console.log(`Simulating router.replace to ${path}`);
    }
  },
});

const toast = {
  error: (msg: string) => console.error(`[TOAST ERROR] ${msg}`),
  success: (msg: string) => console.log(`[TOAST SUCCESS] ${msg}`),
};

// Interface User
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

// Formatter Asia/Jakarta UTC+7 dengan jam & menit
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Fetch data user
  const fetchUsers = async (token: string) => {
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

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userData =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    let isAdmin = false;
    let lastLoginValue = "Belum ada data";

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "admin") {
          isAdmin = true;
          if (parsedUser.last_login) {
            lastLoginValue = formatDateTimeJakarta(parsedUser.last_login);
          }
        }
      } catch (err) {
        console.error("❌ Gagal parse user dari localStorage", err);
      }
    }

    if (!token || !isAdmin) {
      setIsAuthorized(false);
      console.log("Redirect ke /login (Simulasi)");
      return;
    }

    setIsAuthorized(true);
    setLastLogin(lastLoginValue);
    fetchUsers(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleRefresh = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetchUsers(token);
      toast.success("Data berhasil di-refresh.");
    }
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
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-200 py-6 px-2">
      {/* Container utama tengah */}
      <div className="bg-white w-full shadow-lg rounded-xl p-6 max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6 border-b pb-4">
          <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
        </p>

        {/* Data Pengguna */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Data Pengguna ({filteredUsers.length})
        </h2>

        {/* Pencarian */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Tabel dengan scroll horizontal */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full border-collapse border border-gray-200 text-gray-800 text-sm">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 border whitespace-nowrap text-center">
                  ID
                </th>
                <th className="px-4 py-3 border whitespace-nowrap text-left">
                  Email
                </th>
                <th className="px-4 py-3 border whitespace-nowrap text-left">
                  Username
                </th>
                <th className="px-4 py-3 border whitespace-nowrap text-center">
                  Role
                </th>
                <th className="px-4 py-3 border whitespace-nowrap">Created At</th>
                <th className="px-4 py-3 border whitespace-nowrap">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`text-center hover:bg-gray-100 transition duration-150 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 border font-medium text-center">
                      {user.id}
                    </td>
                    <td className="px-4 py-2 border text-left break-words">
                      {user.email}
                    </td>
                    <td className="px-4 py-2 border text-left whitespace-nowrap">
                      {user.username}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {user.role === "admin" ? (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                          ADMIN
                        </span>
                      ) : (
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border whitespace-nowrap">
                      {formatDateOnlyJakarta(user.created_at)}
                    </td>
                    <td className="px-4 py-2 border whitespace-nowrap">
                      {user.phone_number || user.phone || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer bawah tabel */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
          <p className="text-gray-700 font-medium text-sm">
            Total Pengguna:{" "}
            <span className="font-bold text-gray-900">
              {filteredUsers.length}
            </span>
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition duration-150 shadow-md transform hover:scale-[1.02]"
            >
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition duration-150 shadow-md transform hover:scale-[1.02]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
