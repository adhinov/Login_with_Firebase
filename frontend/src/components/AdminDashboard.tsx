"use client";

import { useEffect, useState } from "react";
// Import next/navigation dihapus untuk mengatasi masalah kompilasi.
// import { toast } from "sonner"; // Dinonaktifkan untuk demonstrasi Immersive

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

// ✅ Formatter Asia/Jakarta UTC+7, dengan jam & menit
const formatDateTimeJakarta = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString); // ISO UTC string
    if (isNaN(d.getTime())) return dateString;
    
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(d) + " WIB";
  } catch (err) {
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
  } catch (err) {
    return dateString || "-";
  }
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "/api/mock-users"; // Default untuk demonstrasi

// Fungsi Mocking Data & Auth (untuk lingkungan Immersive)
const useMockAuthAndFetch = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    // Fungsi pengganti router.replace
    const redirect = (path: string) => {
        if (typeof window !== 'undefined') {
             // Menggunakan window.location.replace sebagai pengganti router.replace
            window.location.replace(path);
        } else {
            console.log(`Simulating redirect to ${path}`);
        }
    };

    useEffect(() => {
        // --- Simulasi Otorisasi & Fetch Data ---
        const MOCK_IS_ADMIN = true; // Anggap berhasil login sebagai admin
        const MOCK_LAST_LOGIN = new Date().toISOString(); 
        
        if (!MOCK_IS_ADMIN) {
            setIsAuthorized(false);
            // redirect("/login"); // Ini seharusnya diaktifkan di Next.js real
            return;
        }

        setIsAuthorized(true);
        setLastLogin(formatDateTimeJakarta(MOCK_LAST_LOGIN));

        const fetchMockUsers = async () => {
             // Menggunakan data mock/fallback untuk Immersive
            const data = [
                { id: 1, email: "admin@mail.com", username: "Administrator", role: "admin", created_at: new Date(Date.now() - 86400000).toISOString(), phone_number: "081234567890" },
                { id: 2, email: "user1@mail.com", username: "Budi Santoso", role: "user", created_at: new Date(Date.now() - 3600000 * 25).toISOString() },
                { id: 3, email: "anggota@mail.com", username: "Anggi Pratama", role: "user", created_at: new Date(Date.now() - 3600000 * 50).toISOString(), phone_number: "085678901234" },
                { id: 4, email: "test_panjang@email.com", username: "Pengguna dengan Username Panjang Sekali", role: "user", created_at: new Date(Date.now() - 3600000 * 70).toISOString(), phone_number: "089999999999" },
                { id: 5, email: "user5@mail.com", username: "Lima", role: "user", created_at: new Date(Date.now() - 3600000 * 100).toISOString() },
            ];
            setUsers(data);
        };

        fetchMockUsers(); // Memuat data tiruan
    }, []);

    return { users, lastLogin, isAuthorized, fetchUsers: () => window.location.reload(), redirect }; 
}


export default function AdminDashboard() {
  // Menggunakan fungsi mock untuk lingkungan Immersive
  const { users, lastLogin, isAuthorized, fetchUsers, redirect } = useMockAuthAndFetch(); 
  
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleLogout = () => {
    // Memanggil fungsi redirect yang sudah diperbaiki
    // Di Next.js, ini akan menghapus item dan redirect
    redirect("/login"); 
  };

  const handleRefresh = () => {
    // Karena ini adalah komponen 'use client', window.location.reload() aman
    fetchUsers(); 
  };

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
    // 1. KONTEN UTAMA: w-full dan overflow-x-hidden untuk MENCEGAH SCROLL HALAMAN
    <main className="min-h-screen flex flex-col items-center bg-gray-100 p-4 md:p-8 w-full overflow-x-hidden">
        
      {/* 2. KONTEN KARTU: Menggunakan lebar yang lebih responsif dan padding konsisten */}
      <div className="bg-white rounded-xl shadow-2xl p-4 md:p-8 w-full max-w-6xl mx-auto">
        
        {/* Judul & Last Login (Tetap Tidak Tergeser) */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6 border-b pb-4">
          <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
        </p>

        {/* Daftar Pengguna */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Data Pengguna ({filteredUsers.length})
        </h2>

        {/* Pencarian (Tetap Tidak Tergeser) */}
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            placeholder="Cari pengguna (Email/Username)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-xl px-4 py-2 w-full md:w-80 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* 3. KONTENER TABEL DENGAN SCROLL (HANYA INI YANG BERGESER) */}
        {/* Kontainer ini memiliki overflow-x-auto, dan min-w-full memastikan scrollbar muncul dengan benar */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-inner">
          <table className="min-w-full border-collapse text-gray-800 text-sm">
            <thead className="bg-gray-700 text-white">
              <tr className="text-left uppercase text-xs tracking-wider">
                {/* min-w-[X] memastikan setiap kolom memiliki lebar minimum yang cukup */}
                <th className="px-4 py-3 border whitespace-nowrap min-w-[50px] text-center">ID</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[200px]">Email</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[150px]">Username</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[100px] text-center">Role</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[180px]">Created At</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[150px]">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`text-sm hover:bg-blue-50 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 border text-center font-medium">{user.id}</td>
                    <td className="px-4 py-3 border text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 border text-gray-700">{user.username}</td>
                    <td className="px-4 py-3 border text-center">
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
                    <td className="px-4 py-3 border text-gray-700">
                      {formatDateOnlyJakarta(user.created_at)}
                    </td>
                    <td className="px-4 py-3 border text-gray-700">
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

        {/* Footer/Aksi (Tetap Tidak Tergeser) */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
          <p className="text-gray-700 font-medium text-base">
            Total Pengguna: <span className="font-bold text-gray-900">{filteredUsers.length}</span>
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
