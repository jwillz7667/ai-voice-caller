'use client';

import Credits from '@/components/user/Credits';
import TransactionHistory from '@/components/user/TransactionHistory';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');
    
    // Use session ID to prevent duplicate toasts
    const toastKey = sessionId ? `toast_shown_${sessionId}` : 'toast_shown_canceled';
    
    // Check if we've already shown a toast for this session
    const toastAlreadyShown = localStorage.getItem(toastKey) === 'true';
    
    if (success === 'true' && !toastAlreadyShown) {
      toast.success('Payment successful! Credits have been added to your account.');
      refreshProfile();
      localStorage.setItem(toastKey, 'true');
      
      // Clean URL to prevent toast triggering on refresh
      router.replace('/dashboard/credits');
    } else if (canceled === 'true' && !toastAlreadyShown) {
      toast.error('Payment was canceled. No credits were added.');
      localStorage.setItem(toastKey, 'true');
      
      // Clean URL to prevent toast triggering on refresh
      router.replace('/dashboard/credits');
    }
  }, [searchParams, refreshProfile, router]);

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