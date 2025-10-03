// src/hooks/useAuth.ts
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

const API_URL =
  import.meta.env.VITE_API_URL || "https://login-app-production-7f54.up.railway.app";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("❌ Failed to fetch user:", res.status);
          localStorage.removeItem("token");
          setUser(null);
        } else {
          const data = await res.json();
          console.log("✅ /me response:", data);
          setUser(data.user);
        }
      } catch (err) {
        console.error("❌ Error fetching /me:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
