"use client";

import ResetPassword from "../../../src/components/reset-password";

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = params;
  return <ResetPassword token={token} />;
}
