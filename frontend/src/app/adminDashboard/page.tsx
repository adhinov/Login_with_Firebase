"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // ✅ pakai sonner langsung

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // hanya tampil sekali saat halaman mount
    toast.success("Anda berhasil login sebagai admin 🎉");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    toast("Anda berhasil logout 🚪");

    // force redirect ke login
    router.replace("/login");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Selamat datang di halaman admin! 🎉
        </p>

        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Manajemen User</h2>
          <p className="text-gray-600">
            (Data user bisa ditampilkan di sini nanti)
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
