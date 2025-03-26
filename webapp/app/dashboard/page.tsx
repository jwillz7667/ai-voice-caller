'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/user-store';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { setProfile } = useUserStore();
  
  useEffect(() => {
    if (profile) {
      setProfile(profile);
    }
  }, [profile, setProfile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold text-lg">Credits Balance</h3>
          </div>
          <div className="mb-4">
            <div className="text-4xl font-bold text-primary">{profile?.credits || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Available credits</p>
          </div>
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            Purchase Credits
          </Link>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold text-lg">Make a Call</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Use your credits to make AI-powered voice calls
          </p>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Start Call
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col space-y-1.5 pb-5">
          <h3 className="font-semibold text-lg">Quick Stats</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-background rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Profile Completion</div>
            <div className="text-2xl font-bold">
              {profile?.name ? '100%' : '50%'}
            </div>
            {!profile?.name && (
              <Link 
                href="/dashboard/profile" 
                className="text-primary text-sm hover:underline mt-2 inline-block"
              >
                Complete your profile
              </Link>
            )}
          </div>
          <div className="bg-background rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Call Minutes Available</div>
            <div className="text-2xl font-bold">
              {Math.floor((profile?.credits || 0) / 1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At 1 credit per minute
            </p>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Account Status</div>
            <div className="text-2xl font-bold">
              Active
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 