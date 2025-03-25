import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { userId, credits } = session.metadata || {};
      
      if (!userId || !credits) {
        console.error('Missing userId or credits in session metadata');
        return new NextResponse('Missing required metadata', { status: 400 });
      }

      // Add credits to user's account
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          credits: supabase.rpc('increment_credits', { amount: parseInt(credits) }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating user credits:', profileError);
        return new NextResponse('Error updating user credits', { status: 500 });
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('credits_transactions')
        .insert({
          user_id: userId,
          amount: parseInt(credits),
          transaction_type: 'purchase',
          payment_id: session.id,
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
        return new NextResponse('Error recording transaction', { status: 500 });
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
} 