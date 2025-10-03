// src/services/authService.ts
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://login-app-production-7f54.up.railway.app";

export const login = async (email: string, password: string) => {
  const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
  return res.data;
};

export const register = async (
  username: string,
  email: string,
  password: string
) => {
  const res = await axios.post(`${API_URL}/api/auth/register`, {
    username,
    email,
    password,
  });
  return res.data;
};

export const getProfile = async (token: string) => {
  const res = await axios.get(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const googleLogin = async (idToken: string) => {
  const res = await axios.post(`${API_URL}/api/auth/google-login`, {
    idToken,
  });
  return res.data;
};

export const setPassword = async (
  email: string,
  password: string,
  token: string
) => {
  const res = await axios.post(
    `${API_URL}/api/auth/set-password`,
    { email, password },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
  return res.data;
};

export const resetPassword = async (token: string, password: string) => {
  const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
    token,
    password,
  });
  return res.data;
};
