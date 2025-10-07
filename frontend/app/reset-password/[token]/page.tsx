"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaLock } from "react-icons/fa";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const LockIcon = FaLock as React.ElementType; // ✅ fix tipe icon

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Input tidak lengkap",
        description: "Mohon isi semua kolom password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Pastikan kedua password sama.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        { token, password }
      );

      toast({
        title: "Berhasil!",
        description: response.data.message || "Password berhasil direset.",
      });

      // Redirect ke halaman login setelah 2 detik
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      console.error("Reset error:", error);
      toast({
        title: "Gagal reset password",
        description:
          error.response?.data?.message || "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white/10 p-6 shadow-lg backdrop-blur-md dark:bg-gray-900/60">
        <div className="flex flex-col items-center mb-4">
          <LockIcon className="text-blue-400 text-4xl mb-2" />
          <h1 className="text-2xl font-semibold text-center text-foreground">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Masukkan password baru kamu di bawah ini.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Label htmlFor="password">Password Baru</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
