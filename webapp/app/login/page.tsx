"use client";
 
// Metadata removed for client component compatibility
import CustomLoginForm from '@/components/auth/CustomLoginForm';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// (Optional) Add SEO in a server layout if needed

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
      router.replace('/ai-dashboard');
    }
  }, [router]);
  return (
    <div className="container max-w-5xl py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sign in to Verbio</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
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
