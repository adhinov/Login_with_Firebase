import type { Metadata } from "next";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login - LoginFlow",
  description: "Sign in to your LoginFlow account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <LoginForm />
    </main>
  );
}
