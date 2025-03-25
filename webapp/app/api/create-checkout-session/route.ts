import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const CREDIT_PACKAGES = {
  small: { price: 5, credits: 50 },
  medium: { price: 10, credits: 120 },
  large: { price: 20, credits: 250 },
};

export async function POST(request: Request) {
  try {
    const { userId, packageType, returnUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!packageType || !CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    const { price, credits } = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES];

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Voice Assistant Credits`,
              description: `Package of ${credits} credits for AI voice calls`,
            },
            unit_amount: price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/credits?canceled=true`,
      metadata: {
        userId,
        credits,
        packageType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the checkout session' },
      { status: 500 }
    );
  }
} 