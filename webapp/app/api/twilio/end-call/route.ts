import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json();

    if (!callSid) {
      return NextResponse.json(
        { error: "Call SID is required" },
        { status: 400 }
      );
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_WEBSOCKET_URL?.replace('wss://', 'https://').replace('ws://', 'http://') || "http://localhost:8081";

    // Forward the request to the backend which handles all Twilio logic
    const response = await fetch(`${backendUrl}/end-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callSid }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to end call" },
        { status: response.status }
      );
    }

    // Return the response from backend
    return NextResponse.json({
      success: true,
      message: data.message || "Call ended successfully"
    });

  } catch (error: any) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: error.message || "Failed to end call" },
      { status: 500 }
    );
  }
}