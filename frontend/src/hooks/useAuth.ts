// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil profil dari backend
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
    } catch (err) {
      console.error("❌ Gagal ambil profil:", err);
      setUser(null);
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

    localStorage.setItem("token", token);
    setUser(user);

    return user;
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
