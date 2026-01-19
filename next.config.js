// next.config.js - UPDATED WITH SEO OPTIMIZATIONS
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
    formats: ['image/avif', 'image/webp'], // Modern formats for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Power headers for SEO
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
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ar-SA',
        permanent: true,
      },
      {
        source: '/ar',
        destination: '/ar-SA',
        permanent: true,
      },
      {
        source: '/en',
        destination: '/en-SA',
        permanent: true,
      },
      // Redirect old store URLs if you had a different structure
      {
        source: '/store/:slug',
        destination: '/ar-SA/stores/:slug',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/icons-material', 'lucide-react'],
  },
  
  // Production source maps for debugging (disable in production if needed)
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);