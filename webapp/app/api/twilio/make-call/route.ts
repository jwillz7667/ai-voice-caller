import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a static error response for the build process
  return new NextResponse(
    JSON.stringify({
      error: 'API routes cannot be accessed with static exports. This functionality requires dynamic server endpoints.',
      message: 'Please deploy this application with server-side support to use Twilio call features.'
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
