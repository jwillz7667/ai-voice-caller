'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useUserStore } from '@/lib/user-store';

const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', price: 9.99, credits: 100, description: 'Perfect for casual users' },
  { id: 'professional', name: 'Professional', price: 19.99, credits: 250, description: 'Most popular', featured: true },
  { id: 'enterprise', name: 'Enterprise', price: 49.99, credits: 750, description: 'Ideal for business use' },
  { id: 'unlimited', name: 'Unlimited', price: 99.99, credits: 2000, description: 'Best value for power users' },
];

export default function Credits() {
  const { user, profile } = useAuth();
  const { credits } = useUserStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error('Please sign in to purchase credits');
      return;
    }

    setLoading(packageId);

    try {
      // Always use the real Stripe checkout endpoint
      const endpoint = '/api/create-checkout-session';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packageType: packageId,
          returnUrl: window.location.origin + '/dashboard/credits',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to initiate checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full p-6">
        <div className="flex flex-col space-y-1.5 pb-5">
          <h3 className="font-semibold text-lg">Your Credits</h3>
          <p className="text-sm text-muted-foreground">
            You currently have:
          </p>
        </div>
        <div className="mb-4">
          <div className="text-4xl font-bold text-primary">{profile?.credits || 0}</div>
          <p className="text-sm text-muted-foreground mt-1">Available credits</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Credits are used for AI voice calls at a rate of 1 credit per minute.</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full p-6">
        <div className="flex flex-col space-y-1.5 pb-5">
          <h3 className="font-semibold text-lg">Purchase Credits</h3>
          <p className="text-sm text-muted-foreground">
            Choose a package that suits your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`rounded-lg border p-4 hover:border-primary transition-all ${pkg.featured ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="font-medium text-lg">{pkg.name}</div>
              <div className="text-3xl font-bold mt-2 mb-1">${pkg.price}</div>
              <div className="text-sm text-muted-foreground mb-4">
                {pkg.credits} credits
                {pkg.featured && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                {loading === pkg.id ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 