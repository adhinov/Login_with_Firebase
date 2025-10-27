"use client";

import { useEffect, useState } from "react";
// Simulasi useRouter dan Button dari library yang hilang
const useRouter = () => ({
    push: (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.replace(path);
        } else {
            console.log(`Simulating router.push to ${path}`);
        }
    }
});
const Button = ({ onClick, children, className }: { onClick: () => void, children: React.ReactNode, className: string }) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg font-semibold shadow-md transition duration-150 ${className}`}>
        {children}
    </button>
);
// End Simulasi Libraries

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  phone: string;
}

// Helper untuk format tanggal dari ISO string ke Waktu Jakarta
const formatDateTimeJakarta = (dateString: string): string => {
  try {
    const d = new Date(dateString);
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
  } catch (err) {
    return dateString;
  }
};

const formatDateOnly = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Simulasi environment variable
const API_URL = "https://login-app-production-7f54.up.railway.app"; 

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem("role") : null;
    const lastLoginTime = typeof window !== 'undefined' ? localStorage.getItem("lastLogin") : null; // Ambil dari local storage jika ada

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    // Set last login dari data user jika ada
    if (lastLoginTime) {
        setLastLogin(formatDateTimeJakarta(lastLoginTime));
    } else {
        // Jika tidak ada di localStorage, set waktu saat ini sebagai fallback
        const now = new Date().toISOString();
        setLastLogin(formatDateTimeJakarta(now));
        localStorage.setItem("lastLogin", now); // Simpan waktu login baru
    }


    fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data pengguna.");
          return res.json();
      })
      .then((data) => {
          setUsers(data);
          setLoading(false);
      })
      .catch((err) => {
          console.error("Error fetching users:", err);
          setLoading(false);
      });
  }, [/* router */]); // router dihilangkan dari dependency

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.phone.includes(search)
  );

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* HEADER: Tombol Logout dihapus dari sini */}
      <header className="bg-gray-800 text-white px-4 md:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
      </header>

      {/* MAIN CONTENT CONTAINER (Wrapper luar dengan background abu-abu terang) */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        {/* Card Putih - Membatasi lebar konten di desktop agar terlihat rapi */}
        <div className="bg-white shadow-xl rounded-xl p-4 md:p-8 w-full max-w-4xl mx-auto">

            <p className="text-gray-600 text-sm md:text-base mb-4">
                <span className="font-semibold">Last Login (Anda):</span> {lastLogin}
            </p>
            <hr className="mb-6 border-gray-200" />

            <div className="flex flex-col w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-5">
              Data Pengguna ({users.length})
            </h2>

            <input
              type="text"
              placeholder="Cari pengguna berdasarkan Email, Username, atau Phone..."
              className="w-full mb-6 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition duration-150"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* TABLE CONTAINER - Wajib ada overflow-x-auto */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              {/* KUNCI PERBAIKAN: min-w-full untuk memastikan tabel memenuhi lebar minimum. */}
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="p-3 border-r border-gray-700 w-12">ID</th>
                    {/* Menetapkan min-width agar kolom ini selalu punya ruang */}
                    <th className="p-3 border-r border-gray-700 min-w-[200px]">Email</th>
                    <th className="p-3 border-r border-gray-700 min-w-[150px]">Username</th>
                    <th className="p-3 border-r border-gray-700 w-24 text-center">Role</th>
                    <th className="p-3 border-r border-gray-700 min-w-[120px]">Created At</th>
                    <th className="p-3 min-w-[120px]">Phone</th>
                  </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-500">Memuat data pengguna...</td></tr>
                    ) : (
                        filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}
                                >
                                    <td className="p-3 border-r text-center font-medium">{user.id}</td>
                                    <td className="p-3 border-r text-gray-800 break-words">{user.email}</td>
                                    <td className="p-3 border-r text-gray-800 whitespace-nowrap">{user.username}</td>
                                    <td className="p-3 border-r text-center">
                                        {user.role === "admin" ? (
                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                ADMIN
                                            </span>
                                        ) : (
                                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                USER
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 border-r text-gray-800 whitespace-nowrap">
                                        {formatDateOnly(user.created_at)}
                                    </td>
                                    <td className="p-3 text-gray-800 whitespace-nowrap">
                                        {user.phone || "-"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Tidak ada pengguna yang cocok dengan pencarian Anda.</td></tr>
                        )
                    )}
                </tbody>
              </table>
            </div>
            
            {/* KONTROL BAWAH: Total Pengguna (kiri) dan Tombol Logout (kanan) */}
            <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-200">
                <p className="text-gray-700 font-semibold text-sm md:text-base">
                    Total Pengguna: <span className="text-gray-900 font-bold">{users.length}</span>
                </p>

                {/* Tombol Logout: Disesuaikan paddingnya (px-5 py-2) */}
                <Button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2"
                >
                    Logout
                </Button>
            </div>
            {/* Akhir KONTROL BAWAH */}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white text-center py-3 text-sm mt-auto">
        © {new Date().getFullYear()} Login App — Admin Dashboard
      </footer>
    </div>
  );
}
