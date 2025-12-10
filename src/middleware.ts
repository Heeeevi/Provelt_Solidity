import { NextResponse, type NextRequest } from 'next/server';

// Simplified middleware - no Supabase in Edge runtime
// Auth is handled client-side with wallet connection
export async function middleware(request: NextRequest) {
  // Just pass through - auth handled by wallet connect on client
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match API routes that need protection (none for now)
    '/api/protected/:path*',
  ],
};
