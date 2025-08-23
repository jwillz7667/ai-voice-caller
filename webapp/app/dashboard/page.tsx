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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name || user.email}!</h1>
            <p className="text-muted-foreground mt-2">
              You have {user.credits} credits remaining
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/recordings">
              <Button variant="outline">View Recordings</Button>
            </Link>
            <Link href="/logs">
              <Button variant="outline">View Logs</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <CallInterface />
    </div>
  );
}