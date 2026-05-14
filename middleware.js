// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Only SA locales are allowed
const SUPPORTED_LOCALES = ['ar-SA', 'en-SA'];
const DEFAULT_LOCALE = 'ar-SA';

// ✅ List of dead locale patterns that should return 404 (not redirect)
// These are locale+country combos that were previously supported or are being blocked
const DEAD_LOCALE_PATTERNS = [
  /^\/ar-KW\//,
  /^\/en-AE\//,
  /^\/ar-AE\//,
  /^\/en-KW\//,
  /^\/ar-EG\//, // Egypt
  /^\/en-EG\//,
  /^\/ar-BH\//, // Bahrain
  /^\/en-BH\//,
  /^\/ar-OM\//, // Oman
  /^\/en-OM\//,
  /^\/ar-QA\//, // Qatar
  /^\/en-QA\//,
  /^\/ar-JO\//,
  /^\/en-JO\//,
  /^\/ar-LB\//,
  /^\/en-LB\//,
];

// ✅ Helper to check if a path is a static asset that should never be crawled
const isStaticAsset = (pathname) => {
  const staticPatterns = [
    '/_next/',
    '/store-covers/',      // AVIF images
    '/public/stores/',     // Store logo images
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    // File extensions that should never be treated as pages
    /\.(avif|webp|png|jpg|jpeg|gif|svg|ico)$/i,
    /\.(woff2?|ttf|eot|otf)$/i,
    /\.(json|xml|txt)$/i,
  ];

  return staticPatterns.some(pattern => {
    if (pattern instanceof RegExp) return pattern.test(pathname);
    return pathname.startsWith(pattern);
  });
};

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. IGNORE STATIC ASSETS COMPLETELY (return 404 for direct access)
  // ──────────────────────────────────────────────────────────────────────────
  if (isStaticAsset(pathname)) {
    // Return 404 for direct access to images, fonts, and asset directories
    return new NextResponse(null, { status: 404, statusText: 'Not Found' });
  }

  // Ignore static files and internal Next.js paths (already handled by isStaticAsset, but keep for safety)
  if (
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ADMIN ROUTES (unchanged)
  // ──────────────────────────────────────────────────────────────────────────
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
  // 3. RETURN 404 FOR DEAD LOCALE PATTERNS
  // ──────────────────────────────────────────────────────────────────────────
  for (const pattern of DEAD_LOCALE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, {
        status: 404,
        statusText: 'Not Found',
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. REDIRECT UNSUPPORTED LOCALES TO DEFAULT_LOCALE
  // ──────────────────────────────────────────────────────────────────────────
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\b/);
  if (match) {
    const localeFromUrl = match[1];
    if (!SUPPORTED_LOCALES.includes(localeFromUrl)) {
      const newPathname = pathname.replace(`/${localeFromUrl}`, `/${DEFAULT_LOCALE}`);
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.redirect(url, 301);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. RUN NEXT-INTL MIDDLEWARE FOR ALL OTHER PUBLIC PATHS
  // ──────────────────────────────────────────────────────────────────────────
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
