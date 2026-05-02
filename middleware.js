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

  // 1. Ignore static files and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
    pathname.includes('.') || // .ico, .png, .txt, etc.
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 2. Define admin paths
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi   = pathname.startsWith('/api/admin');

  // 3. BYPASS i18n for admin routes — handle auth directly
  if (isAdminRoute || isAdminApi) {
    const token = await getToken({
      req:    request,
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

  // 4. ✅ FIX: Always run intlMiddleware for all public paths — including those
  //    that already carry a valid locale prefix (/ar-SA/..., /en-SA/...).
  //    The previous `return NextResponse.next()` bypass meant locale detection,
  //    message injection, and intl-level redirects were skipped for the entire
  //    live site, breaking translation loading and lang-attribute accuracy.
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    // Include admin routes
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
