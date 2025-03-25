import { Metadata } from 'next';
import CustomLoginForm from '@/components/auth/CustomLoginForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In - Jingle.AI',
  description: 'Sign in to your Jingle.AI account',
};

export default function LoginPage() {
  return (
    <div className="container max-w-5xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        
        <CustomLoginForm />
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 