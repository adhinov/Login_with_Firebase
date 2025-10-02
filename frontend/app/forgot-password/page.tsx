
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password - LoginFlow',
  description: 'Reset your LoginFlow password.',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <ForgotPasswordForm />
    </main>
  );
}
