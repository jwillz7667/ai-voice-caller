import { NextResponse } from "next/server";

export async function GET() {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a static response for the build process
  return new NextResponse(
    JSON.stringify({
      error: 'API routes cannot be accessed with static exports. Please use client-side credential checking.',
      credentialsSet: false
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
