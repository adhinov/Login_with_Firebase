// app/forgot-password/page.tsx
"use client";

import { Suspense } from "react";
import ForgotPasswordContent from "../../src/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent token={""} />
    </Suspense>
  );
}
