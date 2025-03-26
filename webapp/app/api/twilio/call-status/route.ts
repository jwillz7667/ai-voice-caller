import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  // Static exports don't support server-side API routes with dynamic behavior
  // Return a simple XML response for the build process
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response></Response>
  `;
  
  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
} 