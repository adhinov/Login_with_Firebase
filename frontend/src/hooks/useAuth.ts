// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface User {
  id: number;
  email: string;
  username: string;
  role: string; // "admin" | "user"
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil profil user dari backend
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data.user);
      // Simpan ke localStorage juga (opsional)
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      console.error("❌ Gagal ambil profil:", err);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 🔹 Login
  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    const { token, user } = res.data;

    // Simpan token & user ke localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return { token, user }; // ⬅️ sekarang konsisten dengan login-form.tsx
  };

  // 🔹 Register
  const register = async (email: string, password: string, username: string) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      username,
    });
    return res.data;
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    fetchProfile,
  };
}
