"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams() as { token?: string | string[] | undefined };
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Token tidak ditemukan",
        description: "Tautan reset password tidak valid atau rusak.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || typeof token !== "string") {
      toast({
        title: "Token tidak valid",
        description: "Tidak dapat mereset password tanpa token yang valid.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password terlalu singkat",
        description: "Gunakan minimal 6 karakter.",
      });
      return;
    }

    if (password !== confirm) {
      toast({
        title: "Password tidak cocok",
        description: "Pastikan kedua password sama.",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        { password }
      );

      toast({
        title: "Password berhasil direset",
        description: "Silakan login dengan password baru Anda.",
      });

      router.push("/login");
    } catch (error: any) {
      console.error("❌ Reset password error:", error);
      const message =
        error.response?.data?.message ||
        "Gagal mereset password. Token mungkin sudah kedaluwarsa.";

      toast({
        title: "Gagal reset password",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Tautan tidak valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Tautan reset password tidak valid atau telah kadaluwarsa. Silakan
              minta tautan baru lewat halaman Forgot Password.
            </p>
            <Link href="/forgot-password" className="underline text-primary">
              Kembali ke Forgot Password
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Konfirmasi password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button type="submit" className="w-full py-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
