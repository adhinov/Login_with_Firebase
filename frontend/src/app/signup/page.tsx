import type { Metadata } from 'next';
import { SignupForm } from '@/components/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up - LoginFlow',
  description: 'Create a new LoginFlow account.',
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <SignupForm />
    </main>
  );
}
