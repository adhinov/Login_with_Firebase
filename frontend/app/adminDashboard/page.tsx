"use client";

import { useEffect, useState } from "react";
// Mengganti import useRouter dari "next/navigation" yang tidak tersedia di lingkungan ini
// dan menggantinya dengan simulasi.
// import { useRouter } from "next/navigation"; 
// import { toast } from "sonner"; // Toast juga disimulasikan.

// Simulasi useRouter dan toast
const useRouter = () => ({
    replace: (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.replace(path);
        } else {
            console.log(`Simulating router.replace to ${path}`);
        }
    }
});
const toast = {
    error: (msg: string) => console.error(`[TOAST ERROR] ${msg}`),
    success: (msg: string) => console.log(`[TOAST SUCCESS] ${msg}`)
};
// End Simulasi

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

// Formatter Asia/Jakarta UTC+7, dengan jam & menit
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
  "https://login-app-production-7f54.up.railway.app";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastLogin, setLastLogin] = useState<string>("Belum ada data");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Fungsi fetchUsers dipindahkan ke luar useEffect agar bisa dipanggil saat refresh
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
    // Cek otorisasi admin
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;

    let isAdmin = false;
    let lastLoginValue = "Belum ada data";

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "admin") {
          isAdmin = true;
          if (parsedUser.last_login) {
            // Format ke waktu Jakarta dari ISO UTC
            lastLoginValue = formatDateTimeJakarta(parsedUser.last_login);
          }
        }
      } catch (err) {
        console.error("❌ Gagal parse user dari localStorage", err);
      }
    }

    // Jika tidak ada token atau bukan admin, redirect ke login
    if (!token || !isAdmin) {
      setIsAuthorized(false);
      // Di lingkungan Immersive, ini diubah menjadi console.log untuk menghindari error router
      // router.replace("/login"); 
      console.log("Redirect ke /login (Simulasi)");
      return;
    }

    setIsAuthorized(true);
    setLastLogin(lastLoginValue);

    // Fetch user saat komponen dimuat
    fetchUsers(token);
  }, [/* router */]); // router dihilangkan dari dependencies karena tidak tersedia di sini

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleRefresh = () => {
    // window.location.reload() diganti dengan fetch data ulang jika token tersedia
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
    // 1. KONTEN UTAMA (MAIN): 
    // px-0 untuk mobile, p-8 untuk desktop
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-200 py-4 px-0 md:p-8">
      
      {/* 2. CONTAINER KARTU PUTIH: 
          - w-full memastikan card 100% lebar layar di ponsel.
          - rounded-none pada mobile agar menempel di sisi layar.
          - KUNCI: md:max-w-4xl (untuk ukuran tablet) dan lg:max-w-4xl (untuk ukuran desktop) 
                   digunakan untuk membatasi lebar card di layar besar.
          - mx-auto memastikan card terpusat di layar besar.
      */}
      <div className="bg-white w-full shadow-lg rounded-none md:rounded-xl md:p-8 md:max-w-4xl lg:max-w-4xl mx-auto">
        
        {/* WRAPPER KONTEN (untuk memberi padding horizontal pada semua item non-tabel) */}
        <div className="px-4 py-4 md:p-0">
            {/* Judul */}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mb-6 border-b pb-4">
              <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
            </p>

            {/* Daftar Pengguna */}
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
                // w-full pada input
                className="border rounded-lg px-3 py-2 w-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
        </div>

        {/* 3. KONTENER TABEL DENGAN SCROLL (Tidak diberi padding horizontal) */}
        {/* Tabel tetap 100% lebar dari card, dan scrollable jika isinya terlalu lebar. */}
        <div className="overflow-x-auto w-full max-w-full">
          <table className="min-w-full border-collapse border border-gray-200 text-gray-800 text-xs">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[50px] text-center">ID</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[200px] text-left">Email</th>
                <th className="px-4 py-3 border whitespace-nowrap min-w-[150px] text-left">Username</th>
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
                    className={`text-center ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 border font-medium text-center">{user.id}</td>
                    <td className="px-4 py-2 border text-left max-w-[200px] break-words">{user.email}</td>
                    <td className="px-4 py-2 border text-left max-w-[150px] break-words">{user.username}</td>
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
                    <td className="px-4 py-2 border">
                      {formatDateOnlyJakarta(user.created_at)}
                    </td>
                    <td className="px-4 py-2 border">
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
        
        {/* Footer bawah tabel (diberi padding horizontal px-4) */}
        <div className="px-4 py-4 md:p-0 flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
          <p className="text-gray-700 font-medium text-sm">
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
