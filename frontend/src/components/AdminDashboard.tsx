"use client";

import { useEffect, useState } from "react";
// Import axios diganti dengan fetch API karena lingkungan React Immersive
// tidak menyediakan axios secara default.

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
  if (isNaN(date.getTime())) return "-"; 

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Pengganti fetchUsers menggunakan fetch API
const fetchUsersData = async () => {
    // Ganti dengan endpoint API yang sebenarnya
    const apiUrl = typeof process.env.NEXT_PUBLIC_API_URL !== 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL}/api/users` : '/api/mock-users';
    
    // Fallback data jika API tidak tersedia (untuk demo)
    if (apiUrl === '/api/mock-users') {
        console.warn("Menggunakan data tiruan (mock) untuk demonstrasi.");
        return [
            { id: 1, email: "admin@mail.com", username: "Administrator", role: "admin", created_at: new Date(Date.now() - 86400000).toISOString(), phone_number: "081234567890" },
            { id: 2, email: "user1@mail.com", username: "Budi Santoso", role: "user", created_at: new Date(Date.now() - 3600000 * 25).toISOString() },
            { id: 3, email: "anggota@mail.com", username: "Anggi Pratama", role: "user", created_at: new Date(Date.now() - 3600000 * 50).toISOString(), phone_number: "085678901234" },
            { id: 4, email: "test_panjang@email.com", username: "Pengguna dengan Username Panjang Sekali", role: "user", created_at: new Date(Date.now() - 3600000 * 70).toISOString(), phone_number: "089999999999" },
            { id: 5, email: "user5@mail.com", username: "Lima", role: "user", created_at: new Date(Date.now() - 3600000 * 100).toISOString() },
        ];
    }
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Kesalahan HTTP! Status: ${response.status}`);
        }
        return await response.json() as User[];
    } catch (err) {
        console.error("Kesalahan saat mengambil pengguna:", err);
        return [];
    }
};


export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");

  const fetchUsers = async () => {
    const data = await fetchUsersData();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();

    // Simulasi pengambilan lastLogin
    const loginTime = "2025-10-23T06:33:00.000Z"; 
    if (loginTime) setLastLogin(formatToJakarta(loginTime));
  }, []);

  const handleLogout = () => {
    // Tindakan Logout (simulasi)
    window.location.href = "/login";
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // Kontainer utama: Dibuat w-full dan overflow-x-hidden untuk mencegah scroll halaman
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 text-gray-800 font-sans w-full overflow-x-hidden">
      
      {/* Header - Tetap Tidak Tergeser dan menggunakan padding horizontal di sini */}
      <div className="text-center mb-6 w-full max-w-5xl px-4">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900">
          Dashboard Admin
        </h1>
        <p className="text-sm text-gray-600">
          Last Login (Anda):{" "}
          <span className="font-semibold text-gray-800">{lastLogin || "-"}</span>
        </p>
        <hr className="mt-4 border-gray-300" />
      </div>

      {/* Kontainer Utama Dashboard */}
      <div className="bg-white shadow-2xl rounded-2xl w-[96%] max-w-5xl md:p-8 p-4 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Pengguna</h2>

        {/* Search - Tetap Tidak Tergeser */}
        <div className="mb-6 w-full">
          <input
            type="text"
            placeholder="Cari email atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-base placeholder-gray-500 focus:outline-none focus:border-blue-500 transition duration-150 shadow-sm"
          />
        </div>

        {/* 🚨 Tabel Container - HANYA INI YANG BISA DIGESER (overflow-x-auto) */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner">
          <table className="min-w-full border-collapse text-sm text-left">
            <thead>
              <tr className="bg-gray-700 text-white uppercase text-xs tracking-wider">
                <th className="px-4 py-3 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 whitespace-nowrap">Username</th>
                <th className="px-4 py-3 whitespace-nowrap">Role</th>
                <th className="px-4 py-3 whitespace-nowrap">Created At</th>
                <th className="px-4 py-3 whitespace-nowrap">Phone Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="bg-white hover:bg-blue-50 transition duration-100">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.role === "admin" ? (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          ADMIN
                        </span>
                      ) : (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatToJakarta(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {user.phone_number || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 italic bg-gray-50"
                  >
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer/Aksi - Tetap Tidak Tergeser */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-3 pt-4 border-t border-gray-200">
          <span className="text-base font-medium text-gray-600">
            Total Pengguna:{" "}
            <span className="font-bold text-gray-900">{filteredUsers.length}</span>
          </span>
          <div className="flex space-x-3">
            <button
              onClick={fetchUsers}
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
    </div>
  );
}
