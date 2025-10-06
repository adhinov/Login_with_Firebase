"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ambil token dari localStorage atau sessionStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;

    if (!token) {
      router.push("/login"); // redirect kalau belum login
      return;
    }

    // Fetch data user dari backend
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        if (!data.user) throw new Error("User not found in response");
        setUser(data.user); // backend harus return { user: {...} }
      } catch (err) {
        console.error("Gagal ambil user profile:", err);
        // Opsional: tampilkan pesan error sebelum redirect
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-2">
        Welcome 🎉 {user.username || "User"}
      </h1>
      <p className="text-muted-foreground mb-6">{user.email}</p>
      <Button variant="destructive" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}