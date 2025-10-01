// frontend/src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Begitu user akses domain utama (/), langsung redirect ke /login
  redirect("/login");
}
