import { redirect } from "next/navigation";

export default function Home() {
  // Begitu user buka "/", langsung redirect ke /login
  redirect("/login");
}
