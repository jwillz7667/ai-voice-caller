import { Metadata } from 'next';
import CustomSignupForm from '@/components/auth/CustomSignupForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Register - Jingle.AI',
  description: 'Create a new Jingle.AI account',
};

export default function RegisterPage() {
  return (
    <div className="container max-w-5xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up for Jingle.AI and get 10 free credits
          </p>
        </div>
        
        <CustomSignupForm />
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 