import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // Since auth is handled client-side with auth-context,
  // we'll let the client handle redirects for now
  // This can be enhanced later with server-side session checks

  // For now, just handle basic routing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}