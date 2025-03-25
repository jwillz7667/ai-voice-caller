'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const CREDIT_PACKAGES = {
  small: { price: 5, credits: 50 },
  medium: { price: 10, credits: 120 },
  large: { price: 20, credits: 250 },
};

export default function DevMockStripeSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get params from URL
  const userId = searchParams.get('userId');
  const packageType = searchParams.get('packageType') as keyof typeof CREDIT_PACKAGES;
  const returnUrl = searchParams.get('returnUrl') || '';

  // Process the mock payment
  const processPayment = async () => {
    if (!userId || !packageType || !CREDIT_PACKAGES[packageType]) {
      setError('Invalid parameters');
      return;
    }

    setLoading(true);
    try {
      const credits = CREDIT_PACKAGES[packageType].credits;
      
      // Call the mock webhook to add credits
      const response = await fetch('/api/dev-mock-stripe-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process mock payment');
      }

      setSuccess(true);
      
      // Redirect back after success
      setTimeout(() => {
        const redirectTo = returnUrl || '/dashboard/credits?success=true';
        router.push(redirectTo);
      }, 2000);
      
    } catch (err) {
      console.error('Error processing mock payment:', err);
      setError('Failed to process mock payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Development Mock: Stripe Checkout
        </h1>
        
        {!success && !error && (
          <>
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                This is a development mock of the Stripe checkout process.
                In production, this would be handled by Stripe's checkout page.
              </p>
            </div>
            
            <div className="mb-6">
              <h2 className="font-medium mb-2">Order Details:</h2>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">{packageType || 'Unknown'}</span>
                </li>
                {packageType && CREDIT_PACKAGES[packageType] && (
                  <>
                    <li className="flex justify-between">
                      <span>Credits:</span>
                      <span className="font-medium">{CREDIT_PACKAGES[packageType].credits}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">${CREDIT_PACKAGES[packageType].price}.00</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            <Button 
              className="w-full" 
              onClick={processPayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Mock Payment'}
            </Button>
          </>
        )}
        
        {success && (
          <div className="text-center">
            <div className="mb-4 text-green-600">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 mx-auto"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Payment Successful!</h2>
            <p className="mb-4">Your credits have been added to your account.</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center">
            <div className="mb-4 text-red-600">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 mx-auto"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/credits')}
            >
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 