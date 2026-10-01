import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'apex_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'apex_crm_super_secure_auth_session_secret_jwt_key_2026'
);

// Protected path prefixes
const PROTECTED_PATHS = [
  '/',
  '/pipeline',
  '/contacts',
  '/deals',
  '/leads',
  '/analytics',
  '/activities',
  '/settings',
  '/dashboard',
];

const AUTH_PAGES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, internal Next.js paths, and public auth API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload && payload.userId) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 2. If user is already authenticated and visits login/signup, redirect to pipeline
  if (isAuthenticated && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/pipeline', request.url));
  }

  // 3. Check if path is protected
  const isProtected = PROTECTED_PATHS.some((path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  });

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
