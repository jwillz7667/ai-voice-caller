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

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_WEBSOCKET_URL?.replace('wss://', 'https://').replace('ws://', 'http://') || "http://localhost:8081";

    console.log('[make-call] Using backend URL:', backendUrl);
    console.log('[make-call] Phone number:', phoneNumber);

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

    const data = await response.json();

    if (!response.ok) {
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