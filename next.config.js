// next.config.js - FULLY CORRECTED VERSION
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
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  compress: true,
  generateEtags: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
  
  async redirects() {
    return [
      // ── Handle old 2-letter locale format ──
      {
        source: '/ar',
        destination: '/ar-SA',
        permanent: true,
      },
      {
        source: '/ar/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en',
        destination: '/en-SA',
        permanent: true,
      },
      {
        source: '/en/:path*',
        destination: '/en-SA/:path*',
        permanent: true,
      },

      // ── Redirect root-level static pages to Arabic version (default locale) ──
      { source: '/about', destination: '/ar-SA/about', permanent: true },
      { source: '/contact', destination: '/ar-SA/contact', permanent: true },
      { source: '/privacy', destination: '/ar-SA/privacy', permanent: true },
      { source: '/terms', destination: '/ar-SA/terms', permanent: true },
      { source: '/cookies', destination: '/ar-SA/cookies', permanent: true },
      { source: '/help', destination: '/ar-SA/help', permanent: true },

      // ── Remove trailing slashes (if they exist) ──
      {
        source: '/:path*/',
        destination: '/:path*',
        permanent: true,
      },

      // ── Redirect dead locales to the Arabic version ──
      {
        source: '/:locale(ar-KW|en-AE|ar-AE|en-KW|ar-EG|en-EG|ar-BH|en-BH|ar-OM|en-OM|ar-QA|en-QA|ar-JO|en-JO|ar-LB|en-LB)/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },

      // ── Also handle dead locale without any path (e.g., /ar-KW) ──
      {
        source: '/:locale(ar-KW|en-AE|ar-AE|en-KW|ar-EG|en-EG|ar-BH|en-BH|ar-OM|en-OM|ar-QA|en-QA|ar-JO|en-JO|ar-LB|en-LB)',
        destination: '/ar-SA',
        permanent: true,
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/icons-material', 'lucide-react'],
  },
  
  productionBrowserSourceMaps: false,
  
  // ✅ CRITICAL FIX: Removed skipTrailingSlashRedirect to eliminate duplicate URL issues.
  // Next.js will now automatically redirect /stores/amazon/ → /stores/amazon (301),
  // ensuring Google sees only one canonical version per store page.
  trailingSlash: false,
  // skipTrailingSlashRedirect: true  ← REMOVED
};

export default withNextIntl(nextConfig);
