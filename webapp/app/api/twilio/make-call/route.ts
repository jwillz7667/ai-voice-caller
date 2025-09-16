import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get backend URL from environment - use the websocket server URL
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8081';
    const backendUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');

    // Using backend URL and phone number for the call

    // Forward the request to the backend which handles all Twilio logic
    const response = await fetch(`${backendUrl}/make-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        // Pass any other configuration the backend expects
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('[make-call] Failed to parse backend response:', e);
      data = { error: 'Invalid response from backend' };
    }

    if (!response.ok) {
      console.error('[make-call] Backend returned error:', response.status, data);
      return NextResponse.json(
        { error: data.error || "Failed to initiate call" },
        { status: response.status }
      );
    }

    // Return the response from backend
    return NextResponse.json({
      success: true,
      callSid: data.callSid,
      message: data.message || "Call initiated successfully"
    });

  } catch (error: any) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate call" },
      { status: 500 }
    );
  }
}