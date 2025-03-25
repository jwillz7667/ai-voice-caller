'use client';

import Credits from '@/components/user/Credits';
import TransactionHistory from '@/components/user/TransactionHistory';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Credits have been added to your account.');
      refreshProfile();
    } else if (canceled === 'true') {
      toast.error('Payment was canceled. No credits were added.');
    }
  }, [searchParams, refreshProfile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
      </div>
      
      <Credits />
      
      <TransactionHistory />
    </div>
  );
} 