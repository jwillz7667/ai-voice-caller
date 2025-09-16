import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CREDITS_PER_MINUTE = 1; // 1 credit per minute of call

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await validateSession(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { durationSeconds } = await request.json();

    if (typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 });
    }

    // Calculate credits to deduct (rounded up to nearest minute)
    const minutesUsed = Math.ceil(durationSeconds / 60);
    const creditsToDeduct = minutesUsed * CREDITS_PER_MINUTE;

    // Check if user has enough credits
    if (user.credits < creditsToDeduct) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        sufficient: false,
        required: creditsToDeduct,
        available: user.credits
      }, { status: 400 });
    }

    // Deduct credits and record transaction in a transaction
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: creditsToDeduct
          }
        }
      }),
      prisma.credit_transactions.create({ data: {
        id: crypto.randomUUID(),
          user_id: user.id,
          amount: -creditsToDeduct, // Negative for usage
          transaction_type: 'USAGE',
          description: `${minutesUsed} minute call`,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      credits_used: creditsToDeduct,
      remainingCredits: updatedUser.credits,
      transactionId: transaction.id
    });
  } catch (error) {
    console.error('Error using credits:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}