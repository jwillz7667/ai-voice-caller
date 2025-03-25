import { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reset Password - Jingle.AI',
  description: 'Reset your Jingle.AI account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="container max-w-5xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            We'll send you instructions to reset your password
          </p>
        </div>
        
        <ResetPasswordForm />
      </div>
    </div>
  );
} 