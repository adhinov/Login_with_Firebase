// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

const API_URL = import.meta.env.VITE_API_URL || "https://login-app-production-7f54.up.railway.app";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ambil profil user dari backend
  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Gagal fetch profile");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.removeItem("token");
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      router.push("/login");
      return;
    }
    fetchProfile(token);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout };
}
