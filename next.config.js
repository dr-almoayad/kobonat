// next.config.js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cobonat.me',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.akamaized.net',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      // ✅ Safe wildcard for any HTTPS image
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  compress: true,
  generateEtags: true,

  async headers() {
    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://widget.trustpilot.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com;
      frame-src 'self' https://widget.trustpilot.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ⚠️ IMPORTANT — read before adding more entries here
  //
  // middleware.js runs BEFORE these config-level redirects are evaluated for
  // any path its matcher captures. Its matcher is:
  //
  //   /((?!_next/static|_next/image|favicon.ico|.*\..*|robots.txt|sitemap.xml).*)
  //
  // That pattern catches '/', '/ar', '/en', '/ar/:path*', '/en/:path*',
  // '/stacks', '/coupons', '/blog', '/about', etc. — i.e. EVERY route below
  // that doesn't contain a dot. Inside middleware.js, next-intl's
  // createMiddleware() (localePrefix: 'always', defaultLocale: 'ar-SA')
  // intercepts those requests first and issues its own redirect/rewrite
  // before this file's redirects() ever runs.
  //
  // Net effect: the redirects previously listed here for '/', '/ar',
  // '/ar/:path*', '/en', '/en/:path*', '/stacks', '/coupons', '/blog', and
  // the six static pages (about/contact/privacy/terms/cookies/help) were
  // DEAD CODE — middleware always won the race and either handled them
  // itself (root '/') or mangled the path into an invalid locale-prefixed
  // route before it reached this redirect table (e.g. '/ar' → next-intl
  // tries to treat 'ar' as a page under the default locale rather than
  // recognizing it as a legacy 2-letter locale code, since only 'ar-SA'
  // and 'en-SA' are registered locales).
  //
  // They've been removed here to stop implying they do something they
  // don't. To actually fix legacy '/ar', '/en', and short-path redirects,
  // that logic needs to live IN middleware.js, before intlMiddleware(request)
  // is called — e.g.:
  //
  //   const LEGACY_LOCALE_MAP = { ar: 'ar-SA', en: 'en-SA' };
  //   const legacyMatch = pathname.match(/^\/(ar|en)(\/.*)?$/);
  //   if (legacyMatch) {
  //     const rest = legacyMatch[2] || '';
  //     const url = request.nextUrl.clone();
  //     url.pathname = `/${LEGACY_LOCALE_MAP[legacyMatch[1]]}${rest}`;
  //     return NextResponse.redirect(url, 301);
  //   }
  //
  // Only redirects for paths middleware's matcher does NOT capture (i.e.
  // paths containing a dot, like old flat asset URLs) belong in this file.
  // ─────────────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // ── Dead/decommissioned locale combinations ──
      // Paths like '/ar-KW/...' contain a hyphen but no dot, so middleware
      // DOES reach these before this table — but middleware.js already has
      // its own DEAD_LOCALE_PATTERNS check that 404s them directly, so this
      // redirect never fires either (middleware returns a 404 response first).
      // Kept here only as a fallback in case middleware's dead-locale list
      // and this list ever diverge — remove once middleware is the single
      // source of truth for this behavior.
      {
        source: '/:locale(ar-KW|en-AE|ar-AE|en-KW|ar-EG|en-EG|ar-BH|en-BH|ar-OM|en-OM|ar-QA|en-QA|ar-JO|en-JO|ar-LB|en-LB)/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/:locale(ar-KW|en-AE|ar-AE|en-KW|ar-EG|en-EG|ar-BH|en-BH|ar-OM|en-OM|ar-QA|en-QA|ar-JO|en-JO|ar-LB|en-LB)',
        destination: '/ar-SA',
        permanent: true,
      },
    ];
  },

  // ❌ REMOVED: rewrites() block containing the self-referential /api/:path* mapping

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/icons-material', 'lucide-react'],
  },

  productionBrowserSourceMaps: false,

  trailingSlash: false,
};

export default withNextIntl(nextConfig);
