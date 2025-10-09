// app/reset-password/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ResetPasswordForm from "@/components/reset-password"; // pastikan path sesuai
import { Suspense } from "react";

export default function ResetPasswordPageWrapper() {
  // Dibungkus dengan Suspense agar useSearchParams tidak error
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg">Invalid or missing reset token.</p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
