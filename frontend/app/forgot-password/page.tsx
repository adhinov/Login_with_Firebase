"use client";

import ResetPasswordForm from "@/components/reset-password";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Invalid or missing reset token.</p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
