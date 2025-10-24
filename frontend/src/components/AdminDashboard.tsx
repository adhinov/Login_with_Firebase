"use client";

import { useEffect, useState } from "react";
// Import next/navigation dihapus untuk mengatasi masalah kompilasi.

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

// Konstanta API dipertahankan untuk referensi
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "/api/mock-users"; // Default untuk demonstrasi

// Fungsi Mocking Data & Auth (untuk lingkungan Immersive)
const useMockAuthAndFetch = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const redirect = (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.replace(path);
        } else {
            console.log(`Simulating redirect to ${path}`);
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
                { id: 1, email: "admin@mail.com", username: "Administrator", role: "admin", created_at: new Date(Date.now() - 86400000).toISOString(), phone_number: "081234567890" },
                { id: 2, email: "user1@mail.com", username: "Budi Santoso", role: "user", created_at: new Date(Date.now() - 3600000 * 25).toISOString() },
                { id: 3, email: "anggota@mail.com", username: "Anggi Pratama", role: "user", created_at: new Date(Date.now() - 3600000 * 50).toISOString(), phone_number: "085678901234" },
                { id: 4, email: "test_panjang@email.com", username: "Pengguna dengan Username Panjang Sekali dan Tidak Ada Spasi", role: "user", created_at: new Date(Date.now() - 3600000 * 70).toISOString(), phone_number: "089999999999" },
                { id: 5, email: "user5@mail.com", username: "Lima", role: "user", created_at: new Date(Date.now() - 3600000 * 100).toISOString() },
            ];
            setUsers(data);
        };

        fetchMockUsers(); // Memuat data tiruan
    }, []);

    return { users, lastLogin, isAuthorized, fetchUsers: () => window.location.reload(), redirect }; 
}


export default function AdminDashboard() {
  const { users, lastLogin, isAuthorized, fetchUsers, redirect } = useMockAuthAndFetch(); 
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleLogout = () => {
    redirect("/login"); 
  };

  const handleRefresh = () => {
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
    // 1. KONTEN UTAMA (MAIN): 
    // py-4 (vertikal padding 16px), px-0 (horizontal padding 0) untuk mobile.
    // Ini memastikan seluruh area main tidak membuat scroll horizontal.
    <main className="min-h-screen flex flex-col items-center bg-gray-100 py-4 px-0 md:p-8 w-full overflow-x-hidden">
        
      {/* 2. CONTAINER KARTU (WHITE CARD): 
          - KUNCI: px-0 untuk mobile (card menempel ke sisi layar).
          - KUNCI: rounded-none untuk mobile (card lurus ke sisi layar), dan lg:rounded-xl untuk desktop.
          - md:p-8 dan lg:max-w-6xl memastikan tampilan tetap elegan di desktop.
      */}
      <div className="bg-white shadow-2xl w-full mx-auto px-0 py-4 rounded-none md:p-8 lg:max-w-6xl lg:rounded-xl">
        
        {/* === WRAPPER UNTUK KONTEN NON-TABEL (Mendapatkan Padding Internal) === */}
        {/* Wrapper ini memberi jarak (px-4) antara konten dan sisi card yang sekarang menempel ke layar ponsel */}
        <div className="px-4 md:px-0">
          
            {/* Judul & Last Login */}
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

            {/* Pencarian */}
            <div className="flex items-center justify-between mb-6">
              <input
                type="text"
                placeholder="Cari pengguna (Email/Username)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // w-full pada input
                className="border rounded-xl px-4 py-2 w-full bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            
        </div>
        {/* === END WRAPPER UNTUK KONTEN NON-TABEL === */}


        {/* 3. KONTENER TABEL DENGAN SCROLL (Kontainer ini sengaja dibuat w-full di luar wrapper padding) */}
        {/* Ini memastikan scrollbar tabel berada di lebar 100% card putih. */}
        <div className="overflow-x-auto w-full max-w-full border border-gray-200 rounded-lg shadow-inner">
          <table className="min-w-full border-collapse text-gray-800 text-sm">
            <thead className="bg-gray-700 text-white">
              <tr className="text-left uppercase text-xs tracking-wider">
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
                    <td className="px-4 py-3 border text-gray-700 break-words max-w-[200px]">{user.email}</td>
                    <td className="px-4 py-3 border text-gray-700 break-words max-w-[150px]">{user.username}</td>
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

        {/* Footer/Aksi (Tetap Tidak Tergeser) - Diberi padding horizontal internal (px-4) */}
        <div className="px-4 md:px-0 flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
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
