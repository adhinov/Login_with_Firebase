// frontend/app/reset-password/pages.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token"); // ambil token dari URL (?token=...)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("❌ Password dan konfirmasi tidak cocok.");
      return;
    }

    if (!token) {
      setMessage("❌ Token tidak ditemukan di URL.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/reset-password/${token}`,
        { password }
      );

      setMessage("✅ " + response.data.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Reset Password
        </h2>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <input
            type="password"
            placeholder="Konfirmasi password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            {loading ? "Mengirim..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-gray-700 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}
