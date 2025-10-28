"use client";

import { useEffect, useState } from "react";
// --- START SIMULASI DEPENDENSI ---
// Karena ini adalah satu file React, kita simulasikan useRouter dan menggunakan Fetch API
const useRouter = () => ({
    push: (path: string) => {
        console.log(`Simulating router.push to ${path}`);
        if (typeof window !== 'undefined') {
            window.location.href = path; // Menggunakan window.location untuk simulasi redirect
        }
    }
});

const API_URL = "https://login-app-production-7f54.up.railway.app";
// --- END SIMULASI DEPENDENSI ---


interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone?: string | null;
}

// Formatter Waktu (Sesuai dengan kebutuhan tampilan Waktu Indonesia)
const formatDateTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }) + " WIB";
  } catch {
    return dateString || "-";
  }
};

export default function App() { // Mengubah nama export jika diperlukan agar kompatibel
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Ganti Axios dengan Fetch API
  const fetchUsers = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
      
      if (!res.ok) {
        throw new Error("Gagal mengambil data pengguna.");
      }

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Jika error otorisasi, redirect ke login
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        handleLogout(false); // Logout tanpa redirect karena sudah dipanggil di catch
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedLogin = localStorage.getItem("lastLogin");
    const userRole = localStorage.getItem("role");
    

    if (!token || userRole !== 'admin') {
      router.push("/login");
      return;
    }

    if (storedLogin) setLastLogin(storedLogin);

    fetchUsers(token);
  }, []); // router dihilangkan dari dependencies karena disimulasikan


  const handleLogout = (shouldRedirect = true) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("lastLogin"); // Clear lastLogin juga
    if(shouldRedirect) {
      router.push("/login");
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUsers(token);
    }
  };


  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // Container utama yang responsif
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      {/* Card Konten */}
      <div className="max-w-7xl mx-auto bg-white text-gray-900 rounded-xl shadow-2xl p-6 md:p-8">
        
        {/* Header dan Tombol Logout */}
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-700">Admin Dashboard</h1>
            <p className="text-gray-600 font-medium text-sm mt-1">
              Last Login (Anda):{" "}
              <span className="text-blue-600">{lastLogin || "-"}</span>
            </p>
          </div>
          <button
            onClick={() => handleLogout()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition duration-150 transform hover:scale-105 text-sm"
          >
            Logout
          </button>
        </div>

        {/* Kontrol Data */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-3">
          <h2 className="text-xl font-bold text-gray-700 w-full md:w-auto">
            Data Pengguna (<span className="text-blue-700">{filteredUsers.length}</span>)
          </h2>
          <div className="flex w-full md:w-auto space-x-3">
            <input
              type="text"
              placeholder="Cari email atau username..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-150 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table Wrapper dengan Horizontal Scroll */}
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-inner">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Memuat data pengguna...
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-600 table-fixed"> {/* Kunci perbaikan: table-fixed */}
              <thead className="text-xs uppercase bg-blue-700 text-white sticky top-0">
                <tr>
                  {/* Menetapkan lebar kolom yang tetap, total 100% */}
                  <th scope="col" className="px-3 py-3 w-[5%] border-r border-blue-500">ID</th>
                  <th scope="col" className="px-3 py-3 w-[25%] border-r border-blue-500">Email</th>
                  <th scope="col" className="px-3 py-3 w-[20%] border-r border-blue-500">Username</th>
                  <th scope="col" className="px-3 py-3 w-[10%] border-r border-blue-500 text-center">Role</th>
                  <th scope="col" className="px-3 py-3 w-[25%] border-r border-blue-500">Created At</th>
                  <th scope="col" className="px-3 py-3 w-[15%]">Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/50 transition-colors duration-100`}
                    >
                      <td className="px-3 py-2 border-r border-gray-300 font-medium text-gray-900">{u.id}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-blue-700 font-medium break-all">{u.email}</td> {/* break-all untuk email panjang */}
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-normal">{u.username || "-"}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            u.role?.toUpperCase() === "ADMIN"
                              ? "bg-red-500 text-white shadow-lg"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {u.role?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {u.phone || "-"}
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
          )}
        </div>
      </div>
    </div>
  );
}
