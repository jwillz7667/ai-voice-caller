import { NextResponse } from 'next/server';

/**
 * Development-only mock of Stripe checkout
 * Use instead of create-checkout-session in development
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not available in production', { status: 403 });
  }

  try {
    const { userId, packageType, returnUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the app URL from environment or use a default
    const appUrl = returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Create URL with mock success parameters
    const successUrl = new URL(`${appUrl}/api/dev-mock-stripe-webhook`);
    
    // Build a mock session URL that redirects to the mock webhook endpoint
    // The mock session simulates a successful payment and adds credits
    return NextResponse.json({ 
      url: `${appUrl}/dev-mock-stripe-success?userId=${userId}&packageType=${packageType}&returnUrl=${encodeURIComponent(returnUrl || '')}` 
    });
    
  } catch (error) {
    console.error('Error creating mock checkout:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the mock checkout' },
      { status: 500 }
    );
  }
} 