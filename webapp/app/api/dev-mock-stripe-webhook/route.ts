import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Development-only mock of Stripe webhook
 * Use this endpoint to simulate successful payment in development
 * Example: POST /api/dev-mock-stripe-webhook with body { userId: "user-id", credits: 50 }
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not available in production', { status: 403 });
  }

  try {
    const { userId, credits } = await request.json();
    
    if (!userId || !credits) {
      console.error('Missing userId or credits in mock request');
      return new NextResponse('Missing required data', { status: 400 });
    }

    // Add credits to user's account
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        credits: supabase.rpc('increment_credits', { amount: parseInt(credits.toString()) }),
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
        amount: parseInt(credits.toString()),
        transaction_type: 'purchase',
        payment_id: `dev-mock-${Date.now()}`,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return new NextResponse('Error recording transaction', { status: 500 });
    }

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: 'Development mock: Credits added successfully' 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error processing mock webhook:', error);
    return new NextResponse('Error', { status: 500 });
  }
} 