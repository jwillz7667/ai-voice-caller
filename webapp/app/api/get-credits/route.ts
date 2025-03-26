import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Remove the dynamic export to make it compatible with static exports

export async function GET(request: Request) {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a 405 Method Not Allowed status for static builds
  return new NextResponse(
    JSON.stringify({
      error: 'API routes cannot be accessed with static exports. Please fetch data directly from Supabase client-side.'
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
} 