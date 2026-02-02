// next.config.js - FIXED: Removed problematic redirects
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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
  
  // ✅ REMOVED: All redirects that could cause indexing issues
  // Let middleware handle all locale routing
  
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
  
  // ✅ CRITICAL: Ensure trailing slash behavior is consistent
  trailingSlash: false,
  
  // ✅ Skip trailing slash redirect to avoid redirect chains
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
