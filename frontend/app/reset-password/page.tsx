"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResetPassword from "@/components/reset-password";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <ResetPasswordWrapper />
    </Suspense>
  );
}

function ResetPasswordWrapper() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return <ResetPassword token={token || ""} />;
}
