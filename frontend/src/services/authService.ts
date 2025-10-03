// src/services/authService.ts
import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
  previousLogin?: string;
}

export const login = async (email: string, password: string) => {
  const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
    username,
    email,
    password,
  });
  return response.data;
};

export const getProfile = async (token: string) => {
  const response = await axios.get(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
