// src/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as loginService, getProfile } from "@/services/authService";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Cek token di localStorage saat pertama kali load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getProfile(token)
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
          }
        })
        .catch((err) => {
          console.error("❌ Gagal ambil profil:", err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Fungsi login
  const login = async (email: string, password: string) => {
    try {
      const result = await loginService(email, password);
      if (result.token) {
        localStorage.setItem("token", result.token);
      }
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("role", result.user.role || "");
        setUser(result.user);
      }

      // ✅ Redirect sesuai role
      if (result.user.role === "admin") {
        router.push("/adminDashboard");
      } else {
        router.push("/welcome");
      }

      return result;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  // ✅ Fungsi logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("lastLogin");
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    loading,
    login,
    logout,
  };
}
