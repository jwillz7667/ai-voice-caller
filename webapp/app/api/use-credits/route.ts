import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CREDITS_PER_MINUTE = 1; // 1 credit per minute of call

export async function POST(request: Request) {
  try {
    const { userId, durationSeconds } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 });
    }

    // Calculate credits to deduct (rounded up to nearest minute)
    const minutesUsed = Math.ceil(durationSeconds / 60);
    const creditsToDeduct = minutesUsed * CREDITS_PER_MINUTE;

    // Get current credits
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!userData || userData.credits < creditsToDeduct) {
      return NextResponse.json({ error: 'Insufficient credits', sufficient: false }, { status: 400 });
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: userData.credits - creditsToDeduct,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credits_transactions')
      .insert({
        user_id: userId,
        amount: creditsToDeduct,
        transaction_type: 'usage',
        description: `${minutesUsed} minute call`
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Continue anyway as credits were already deducted
    }

    return NextResponse.json({
      success: true,
      creditsUsed: creditsToDeduct,
      remainingCredits: userData.credits - creditsToDeduct
    });
  } catch (error) {
    console.error('Error using credits:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 