import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get token from header or cookie
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.cookies.get('auth-token')?.value;

    if (token) {
      await deleteSession(token);
    }

    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even on error, clear the cookie
    const response = NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}