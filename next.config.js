// next.config.js - FINAL CORRECTED VERSION
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

      // ── Redirect root-level static pages to Arabic version ──
      { source: '/about', destination: '/ar-SA/about', permanent: true },
      { source: '/contact', destination: '/ar-SA/contact', permanent: true },
      { source: '/privacy', destination: '/ar-SA/privacy', permanent: true },
      { source: '/terms', destination: '/ar-SA/terms', permanent: true },
      { source: '/cookies', destination: '/ar-SA/cookies', permanent: true },
      { source: '/help', destination: '/ar-SA/help', permanent: true },

      // ── ✅ KEEP only exact‑path redirects for key routes ──
      { source: '/stacks', destination: '/ar-SA/stacks', permanent: true },
      { source: '/coupons', destination: '/ar-SA/coupons', permanent: true },
      { source: '/blog', destination: '/ar-SA/blog', permanent: true },

      // ❌ REMOVED: /blog/:path*, /categories/:path*, /stores/:path*
      // They break static images (logos, category icons).

      // ── Redirect dead locales ──
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
  
  trailingSlash: false,
  // skipTrailingSlashRedirect: true ← REMOVED
};

export default withNextIntl(nextConfig);
