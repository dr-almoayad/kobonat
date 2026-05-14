// app/robots.js
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export default function robots() {
  return {
    rules: [
      // ──────────────────────────────────────────────────────────────────────
      // 1. GOOGLEBOT (primary crawler)
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
        ],
        disallow: [
          // Admin & API
          '/admin/',
          '/api/',
          '/api/admin/',
          '/api/auth/',
          '/*/auth/',
          
          // Search – never index search results
          '/*/search',
          '/*/search?*',
          
          // Static asset directories
          '/_next/',
          '/_next/static/',
          '/store-covers/',
          '/public/stores/',
          '/favicon.ico',
          
          // Dead locales – return 404, but block crawling
          '/ar-KW/',
          '/en-AE/',
          '/ar-AE/',
          '/en-KW/',
          '/ar-EG/',
          '/en-EG/',
          '/ar-BH/',
          '/en-BH/',
          '/ar-OM/',
          '/en-OM/',
          '/ar-QA/',
          '/en-QA/',
          
          // File extensions – never index raw files
          '/*.json$',
          '/*.js$',
          '/*.css$',
          '/*.avif$',
          '/*.webp$',
          '/*.png$',
          '/*.jpg$',
          '/*.jpeg$',
          '/*.gif$',
          '/*.svg$',
          '/*.ico$',
          '/*.woff$',
          '/*.woff2$',
          '/*.ttf$',
          '/*.eot$',
          '/*.otf$',
          '/*.xml$',
          '/*.txt$',
          
          // Query parameters that create duplicate content
          '/*?ref=*',
          '/*?utm_*',
          '/*?source=*',
          '/*?fbclid=*',
          '/*?gclid=*',
        ],
        crawlDelay: 0,
      },

      // ──────────────────────────────────────────────────────────────────────
      // 2. GOOGLEBOT-IMAGE (prevent standalone image crawling)
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Googlebot-Image',
        disallow: [
          '/',
          '/store-covers/',
          '/public/stores/',
          '/_next/static/',
        ],
      },

      // ──────────────────────────────────────────────────────────────────────
      // 3. BINGBOT
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/*/search',
          '/*/search?*',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
          '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
          '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
          '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
          '/*.json$', '/*.js$', '/*.css$',
          '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$', '/*.jpeg$',
          '/*.woff$', '/*.woff2$',
        ],
        crawlDelay: 0,
      },

      // ──────────────────────────────────────────────────────────────────────
      // 4. DEFAULT FOR ALL OTHER BOTS
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: '*',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/*/auth/',
          '/*/search',
          '/*/search?*',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
          '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
          '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
          '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
          '/*?ref=*', '/*?utm_*', '/*?source=*', '/*?fbclid=*',
          '/*.json$', '/*.js$', '/*.css$',
          '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$', '/*.jpeg$',
          '/*.woff$', '/*.woff2$', '/*.ttf$',
        ],
      },

      // ──────────────────────────────────────────────────────────────────────
      // 5. AGGRESSIVE CRAWLERS – slow them down
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'AhrefsBot',
        disallow: [
          '/',
          '/admin/',
          '/api/',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
        ],
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        disallow: [
          '/',
          '/admin/',
          '/api/',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
        ],
        crawlDelay: 10,
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
      {
        userAgent: 'YandexBot',
        disallow: '/',
      },
      {
        userAgent: 'Baiduspider',
        disallow: '/',
      },

      // ──────────────────────────────────────────────────────────────────────
      // 6. AI TRAINING CRAWLERS – allowed (no sensitive pages)
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
