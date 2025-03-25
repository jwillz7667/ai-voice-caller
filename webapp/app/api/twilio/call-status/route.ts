import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const userId = formData.get('UserId') as string;
    
    console.log(`Call ${callSid} ${callStatus} with duration ${callDuration} seconds for user ${userId}`);
    
    // If call is completed and we have duration and user ID, deduct credits
    if (callStatus === 'completed' && callDuration && userId) {
      const durationSeconds = parseInt(callDuration, 10);
      
      // Make API call to use-credits endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/use-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          durationSeconds,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error using credits:', error);
      } else {
        const result = await response.json();
        console.log(`Successfully deducted ${result.creditsUsed} credits, remaining: ${result.remainingCredits}`);
      }
    }
    
    // Create a TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>
    `;
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling call status webhook:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 