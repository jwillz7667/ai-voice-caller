import { Metadata } from 'next';
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm';

export const metadata: Metadata = {
  title: 'Update Password - Jingle.AI',
  description: 'Set a new password for your Jingle.AI account',
};

export default function UpdatePasswordPage() {
  return (
    <div className="container max-w-5xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Update Password</h1>
          <p className="text-muted-foreground mt-2">
            Create a new password for your account
          </p>
        </div>
        
        <UpdatePasswordForm />
      </div>
    </div>
  );
} 