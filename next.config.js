// next.config.js - FINAL CORRECTED VERSION (single locale: ar-SA)
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
      // ✅ Add robots noindex for old locale paths (defensive)
      {
        source: '/en-SA/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/en/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/ar-KW/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/en-AE/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  
  // ✅ Redirect all non‑Arabic locales to ar-SA (301 permanent)
  async redirects() {
    return [
      // Redirect /en-SA and /en to ar-SA
      {
        source: '/en-SA/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      // Redirect other dead locale patterns
      {
        source: '/ar-KW/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-AE/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/ar-AE/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-KW/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/ar-EG/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-EG/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/ar-BH/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-BH/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/ar-OM/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-OM/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/ar-QA/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      {
        source: '/en-QA/:path*',
        destination: '/ar-SA/:path*',
        permanent: true,
      },
      // Also redirect root /en (no path) and /en-SA (no path)
      {
        source: '/en-SA',
        destination: '/ar-SA',
        permanent: true,
      },
      {
        source: '/en',
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
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
