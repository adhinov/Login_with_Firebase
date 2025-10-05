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

  // Ambil profil user dari backend
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

      if (res.data && res.data.user) {
        setUser(res.data.user);
        // Simpan ke localStorage juga (opsional)
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (err: any) {
      setUser(null);
      localStorage.removeItem("user");
      // Optional: bisa return error, atau log
      console.error("❌ Gagal ambil profil:", err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Login - dengan error handling yang lebih baik
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (!res.data || !res.data.token || !res.data.user) {
        throw new Error(res.data?.message || "Response tidak valid dari server");
      }

      const { token, user } = res.data;

      // Simpan token & user ke localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return { token, user };
    } catch (error: any) {
      // Tangkap error dari backend (misal login gagal, server error)
      let message = "Login gagal. Silakan coba lagi.";
      // Jika backend mengirim pesan error, tampilkan
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      // Boleh throw error dengan custom message supaya bisa ditangkap di komponen login-form
      throw new Error(message);
    }
  };

  // Register - error handling juga bisa ditambah
  const register = async (email: string, password: string, username: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        username,
      });
      return res.data;
    } catch (error: any) {
      let message = "Registrasi gagal. Silakan coba lagi.";
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message);
    }
  };

  // Logout
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