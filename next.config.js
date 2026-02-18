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
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // ✅ ADDED: Only redirects for old locale formats (if Google has them indexed)
  // These HELP SEO by preventing 404s on legacy URLs
  async redirects() {
    return [
      // Handle old 2-letter locale format (if you ever used /ar or /en)
      {
        source: '/ar',
        destination: '/ar-SA',
        permanent: true,  // 301 redirect
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
  
  // ✅ CRITICAL: Consistent trailing slash behavior
  trailingSlash: false,
  
  // ✅ Skip trailing slash redirect to avoid redirect chains
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
