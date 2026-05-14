// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Only SA locales are allowed
const SUPPORTED_LOCALES = ['ar-SA', 'en-SA'];
const DEFAULT_LOCALE = 'ar-SA';

// ✅ List of dead locale patterns that should return 404 (not redirect)
// These are locale+country combos that were previously supported but are now completely removed
// Google still has them in index – returning 404 will make Google drop them faster
const DEAD_LOCALE_PATTERNS = [
  /^\/ar-KW\//,
  /^\/en-AE\//,
  /^\/ar-AE\//,
  /^\/en-KW\//,
  /^\/ar-EG\//,
  /^\/en-EG\//,
  /^\/ar-BH\//,
  /^\/en-BH\//,
  /^\/ar-OM\//,
  /^\/en-OM\//,
  /^\/ar-QA\//,
  /^\/en-QA\//,
];

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignore static files and internal paths
  if (
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Admin routes (unchanged)
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminRoute || isAdminApi) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!token || !token.isAdmin) {
      if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ✅ FIX 1: Return 404 for dead locale patterns (ar-KW, en-AE, etc.)
  // Google will drop these URLs from index faster with a 404 than a 301 redirect
  // ──────────────────────────────────────────────────────────────────────────
  for (const pattern of DEAD_LOCALE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, { 
        status: 404, 
        statusText: 'Not Found' 
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ✅ FIX 2: Redirect unsupported locales to DEFAULT_LOCALE
  // For example, /fr-SA/about → 301 redirect to /ar-SA/about
  // ──────────────────────────────────────────────────────────────────────────
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\b/);
  if (match) {
    const localeFromUrl = match[1];
    if (!SUPPORTED_LOCALES.includes(localeFromUrl)) {
      // Replace unsupported locale with default
      const newPathname = pathname.replace(`/${localeFromUrl}`, `/${DEFAULT_LOCALE}`);
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      // Use 301 permanent redirect – these will never come back
      return NextResponse.redirect(url, 301);
    }
  }

  // Run next-intl middleware for all other public paths
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
