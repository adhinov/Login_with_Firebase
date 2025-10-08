"use client";

import { useParams } from "next/navigation";
import ResetPassword from "../../../src/components/reset-password";

export default function ResetPasswordPage() {
  // Ambil token dari URL misalnya: /reset-password/abc123
  const params = useParams();
  const token = params?.token as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Reset Password
        </h1>
        <ResetPassword token={token} />
      </div>
    </div>
  );
}
