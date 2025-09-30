"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user"; // opsional
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // 🔹 Ambil token dari localStorage atau sessionStorage
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // 🔹 Decode JWT payload
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        const role = decodedPayload.role;
        const exp = decodedPayload.exp;

        // 🔹 Cek expired token
        if (exp && Date.now() >= exp * 1000) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        // 🔹 Cek role (jika ada requirement khusus)
        if (requiredRole && role !== requiredRole) {
          if (role === "admin") {
            router.replace("/adminDashboard");
          } else {
            router.replace("/welcome");
          }
          return;
        }

        setIsAuthorized(true); // ✅ authorized
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        router.replace("/login");
      }
    };

    checkAuth();
  }, [requiredRole, router]);

  if (!isAuthorized) {
    return null; // bisa diganti spinner/loading
  }

  return <>{children}</>;
}
