import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Automatically permit all /api/auth requests to bypass authentication checks
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Extract erp_token JWT from secure httpOnly cookies
  const token = req.cookies.get('erp_token')?.value;

  // 3. Handle unauthenticated states
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Authentication token is missing.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Cryptographically verify the JWS signature
  const decoded = await verifyJWT(token);

  if (!decoded) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Authentication token is invalid or expired.' }, { status: 401 });
    }
    // Delete bad cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('erp_token');
    return response;
  }

  // 5. Enforce middleware-level dashboard role guards
  if (pathname.startsWith('/dashboard/supervisors') && decoded.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/supervisor', req.url));
  }

  if (pathname.startsWith('/api/supervisors') && decoded.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
  }

  if (pathname.startsWith('/dashboard/admin') && decoded.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/supervisor', req.url));
  }

  if ((pathname === '/dashboard/supervisor' || pathname.startsWith('/dashboard/supervisor/')) && decoded.role !== 'SUPERVISOR') {
    return NextResponse.redirect(new URL('/dashboard/admin', req.url));
  }

  // Continue request lifecycle
  return NextResponse.next();
}
