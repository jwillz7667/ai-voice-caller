'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CallInterface from '@/components/call-interface';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-full">
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome, {user.name || user.email}!</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
              You have {user.credits} credits remaining
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <Link href="/recordings" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">View Recordings</Button>
            </Link>
            <Link href="/logs" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">View Logs</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <CallInterface />
    </div>
  );
}