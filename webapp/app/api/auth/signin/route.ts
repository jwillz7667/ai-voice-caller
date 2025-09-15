import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Signin failed' },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data);

    // Forward cookies from backend if present
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.headers.set('set-cookie', setCookieHeader);
    }

    return res;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}