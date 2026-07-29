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

  // ── ✅ NEW: Transpile the local SDK ──
  transpilePackages: [
    'creatorsapi-nodejs-sdk', // Amazon Creators API SDK
  ],

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
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // ── Redirects (kept as-is) ──
  async redirects() {
    return [
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

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/icons-material', 'lucide-react', 'creatorsapi-nodejs-sdk'],
  },

  productionBrowserSourceMaps: false,
  trailingSlash: false,
};

export default withNextIntl(nextConfig);
