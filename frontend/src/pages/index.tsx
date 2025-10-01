// src/pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // redirect ke /login
  }, [router]);

  return null; // tidak menampilkan apa-apa
}
