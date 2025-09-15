'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Zap, TrendingUp, Crown } from 'lucide-react';
import { useAuth } from './auth-context';
import { useToast } from '@/components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  priceDisplay: string;
  popular?: boolean;
  savings?: string;
  icon: any;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 100,
    price: 999,
    priceDisplay: '$9.99',
    icon: Zap
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    tokens: 500,
    price: 3999,
    priceDisplay: '$39.99',
    popular: true,
    savings: 'Save 20%',
    icon: TrendingUp
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1200,
    price: 8999,
    priceDisplay: '$89.99',
    savings: 'Save 25%',
    icon: Crown
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 5000,
    price: 34999,
    priceDisplay: '$349.99',
    savings: 'Save 30%',
    icon: CreditCard
  }
];

export function TokenPurchase() {
  const { user, accessToken, checkBalance } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to purchase tokens',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedPackage(packageId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/purchase/success`,
          cancelUrl: `${window.location.origin}/purchase/cancel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      toast({
        title: 'Purchase failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Purchase Tokens</h2>
        <p className="text-gray-600 mt-2">Choose a package that fits your needs</p>
        {user && (
          <div className="mt-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Current Balance: {user.tokenBalance} tokens
            </Badge>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TOKEN_PACKAGES.map((pkg) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;

          return (
            <Card
              key={pkg.id}
              className={`relative transition-all ${
                pkg.popular
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'hover:shadow-md'
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Icon className="h-12 w-12 text-blue-500" />
                </div>
                <CardTitle className="text-center">{pkg.name}</CardTitle>
                <CardDescription className="text-center">
                  {pkg.tokens} tokens
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="text-3xl font-bold">{pkg.priceDisplay}</div>
                <div className="text-sm text-gray-500 mt-1">
                  ${(pkg.price / pkg.tokens / 100).toFixed(3)} per token
                </div>
                {pkg.savings && (
                  <Badge variant="secondary" className="mt-2">
                    {pkg.savings}
                  </Badge>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={pkg.popular ? 'default' : 'outline'}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                >
                  {isLoading && isSelected ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Secure payment powered by Stripe</p>
        <p className="mt-1">Tokens never expire and can be used anytime</p>
      </div>
    </div>
  );
}