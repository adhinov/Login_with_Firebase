"use client";

import ResetPassword from "../../../src/components/reset-password";

interface PageProps {
  params: { token: string };
}

export default function Page({ params }: PageProps) {
  return <ResetPassword token={params.token} />;
}
