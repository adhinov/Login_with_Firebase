"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ResetPasswordForm from "../../src/components/reset-password";

export default function ResetPasswordPage() {
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
