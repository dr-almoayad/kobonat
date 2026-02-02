import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { allLocaleCodes } from './i18n/locales';

const intlMiddleware = createMiddleware({
  locales: allLocaleCodes,
  defaultLocale: 'ar-SA',
  localePrefix: 'always',
  // ✅ CRITICAL: Prevent redirect loops
  localeDetection: false,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. MANUAL CHECK: Ignore static files and internal Next.js paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') && !pathname.startsWith('/api/admin') ||
    pathname.includes('.') || // Catches .ico, .png, .txt, etc.
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 2. Define admin paths
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  // 3. BYPASS i18n for admin routes
  if (isAdminRoute || isAdminApi) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
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

  // 4. ✅ CRITICAL FIX: Check if already on a valid locale path
  const hasValidLocale = allLocaleCodes.some(locale => pathname.startsWith(`/${locale}`));
  
  // If already on a valid locale path, don't redirect
  if (hasValidLocale) {
    return NextResponse.next();
  }

  // 5. APPLY i18n only for paths without locale
  return intlMiddleware(request);
}

export const config = {
  // Enhanced matcher to exclude more static patterns
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    // Include admin routes
    '/admin/:path*', 
    '/api/admin/:path*'
  ]
};
