import { NextResponse } from "next/server";

export async function GET() {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a static response for the build process
  return new NextResponse(
    JSON.stringify({
      error: 'API routes cannot be accessed with static exports. Please use client-side Twilio SDK for phone numbers.',
      data: []
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(req: Request) {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a static error response for the build process
  return new NextResponse(
    JSON.stringify({
      error: 'API routes cannot be accessed with static exports. This functionality requires dynamic server endpoints.',
      message: 'Please deploy this application with server-side support to use Twilio phone number features.'
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
