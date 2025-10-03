// hooks/useAuth.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  login as loginService,
  register as registerService,
  getProfile,
} from "@/services/authService";

// ✅ hanya ambil dari NEXT_PUBLIC_API_URL, tanpa fallback ke localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil profil user jika ada token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getProfile(token)
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("❌ Gagal ambil profil:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Login
  const login = async (email: string, password: string) => {
    const data = await loginService(email, password);
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }
    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  // 🔹 Register
  const register = async (username: string, email: string, password: string) => {
    return await registerService(username, email, password);
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}
