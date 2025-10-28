"use client";

import { useEffect, useState } from "react";
// Karena ini adalah lingkungan Immersive, useRouter di sini disimulasikan agar dapat berjalan.
// Dalam project Next.js asli Anda, Anda harus menggunakan: import { useRouter } from "next/navigation";
const useRouter = () => ({
    replace: (path: string) => {
        console.log(`Simulating router.replace to ${path}`);
        if (typeof window !== 'undefined') {
            // Menggunakan window.location.replace untuk simulasi redirect
            window.location.replace(path);
        }
    }
});

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone_number?: string | null;
  last_login?: string | null;
}

// Catatan: Di lingkungan Immersive, process.env tidak tersedia. Kita hardcode untuk simulasi.
const API_URL =
  // process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

const formatDateJakarta = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    // Cek validitas tanggal
    if (isNaN(d.getTime())) return dateString;

    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(d) + " WIB";
  } catch {
    return dateString || "-";
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("Memuat...");
  const [loading, setLoading] = useState(true);

  // --- Perbaikan #1: Pisahkan fungsi logout menjadi dua (jika diperlukan) atau hapus parameternya
  // Fungsi yang dipanggil saat klik tombol, tanpa parameter event.
  const handleLogoutClick = () => {
    localStorage.clear();
    router.replace("/login");
  };

  // Fungsi pembantu untuk logout paksa (digunakan di useEffect/fetch, yang tidak terkait dengan event klik)
  const forceLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  // Logika Fetch Data
  const fetchUsers = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 401) {
        // Jika token tidak valid, panggil forceLogout
        forceLogout();
        throw new Error("Unauthorized");
      }
      
      if (!res.ok) {
        throw new Error("Gagal mengambil data pengguna.");
      }

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== "admin") {
        router.replace("/login");
        return;
      }
      setLastLogin(formatDateJakarta(user.last_login));
    } catch (e) {
      // Handle jika JSON.parse gagal
      console.error("Error parsing user data:", e);
      router.replace("/login");
      return;
    }
    
    fetchUsers(token);
  }, []);


  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

  // --- handleLogout dihapus, diganti dengan handleLogoutClick di JSX

  const handleRefresh = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUsers(token);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-800 text-white py-4 px-6 shadow-xl flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <button
          // --- Perbaikan #2: Menggunakan fungsi tanpa parameter
          onClick={handleLogoutClick}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition duration-200"
        >
          Logout
        </button>
      </header>

      {/* Main Content Wrapper */}
      <main className="flex-grow w-full max-w-7xl mx-auto py-8 px-4 md:px-8">
        <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-8">
          
          <p className="text-gray-600 text-sm mb-6 border-b pb-4">
            <span className="font-bold text-gray-700">Last Login (Anda):</span> {lastLogin}
          </p>

          {/* Kontrol Data & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex-grow">
              Data Pengguna ({filteredUsers.length})
            </h2>
            <div className="flex w-full md:w-auto space-x-3">
              <input
                type="text"
                placeholder="Cari berdasarkan email atau username..."
                className="w-full md:w-96 p-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition duration-200 whitespace-nowrap"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tabel Container */}
          <div className="overflow-x-auto rounded-lg shadow-xl border border-gray-200">
            {/* Tambahkan table-fixed untuk perataan yang benar */}
            <table className="min-w-full table-fixed border-collapse text-sm text-gray-800">
              <thead className="bg-gray-700 text-white sticky top-0">
                <tr>
                  {/* Atur lebar kolom secara eksplisit (total 100%) */}
                  <th className="p-3 border-r border-gray-600 w-[5%] text-center">ID</th>
                  <th className="p-3 border-r border-gray-600 w-[25%] text-left">Email</th>
                  <th className="p-3 border-r border-gray-600 w-[20%] text-left">Username</th>
                  <th className="p-3 border-r border-gray-600 w-[10%] text-center">Role</th>
                  <th className="p-3 border-r border-gray-600 w-[25%] text-center">Created At</th>
                  <th className="p-3 w-[15%] text-center">Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-gray-500 italic bg-white"
                    >
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition duration-150`}
                    >
                      <td className="p-3 text-center font-medium border-r border-gray-200">{user.id}</td>
                      {/* break-all untuk email yang terlalu panjang */}
                      <td className="p-3 border-r border-gray-200 break-all">
                        {user.email}
                      </td>
                      <td className="p-3 border-r border-gray-200 whitespace-normal">{user.username}</td>
                      <td className="p-3 text-center border-r border-gray-200">
                        {user.role === "admin" ? (
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            ADMIN
                          </span>
                        ) : (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center border-r border-gray-200 whitespace-nowrap">
                        {formatDateJakarta(user.created_at)}
                      </td>
                      {/* break-all untuk nomor telepon yang panjang tanpa spasi */}
                      <td className="p-3 text-center break-all">
                        {user.phone_number || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-gray-500 italic bg-white"
                    >
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            Total Pengguna: <span className="font-bold text-gray-800">{users.length}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-3 text-sm mt-auto">
        © {new Date().getFullYear()} Login App — Admin Dashboard
      </footer>
    </div>
  );
}
