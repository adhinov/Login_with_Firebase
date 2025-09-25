// src/app/login/page.tsx
"use client";

import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <LoginForm />
    </main>
  );
}
