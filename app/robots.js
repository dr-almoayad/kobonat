const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Reusable building blocks ──────────────────────────────────────────────────

const ALLOW_PAGES = [
  '/',
  '/ar-SA/', '/ar-SA/coupons', '/ar-SA/stores', '/ar-SA/stores/*', '/ar-SA/categories', '/ar-SA/categories/*', '/ar-SA/stacks', '/ar-SA/blog', '/ar-SA/blog/*', '/ar-SA/about', '/ar-SA/contact', '/ar-SA/privacy', '/ar-SA/cookies', '/ar-SA/terms', '/ar-SA/help', '/ar-SA/seasonal/*', '/ar-SA/bank-and-payment-offers',
  '/en-SA/', '/en-SA/coupons', '/en-SA/stores', '/en-SA/stores/*', '/en-SA/categories', '/en-SA/categories/*', '/en-SA/stacks', '/en-SA/blog', '/en-SA/blog/*', '/en-SA/about', '/en-SA/contact', '/en-SA/privacy', '/en-SA/cookies', '/en-SA/terms', '/en-SA/help', '/en-SA/seasonal/*', '/en-SA/bank-and-payment-offers',
];

// ✅ FIX 1: Removed internal /api/context from ALLOW_FEEDS
const ALLOW_FEEDS = [
  '/api/feeds/stores',
  '/api/feeds/stores.json',
  '/api/feeds/coupons',
  '/api/feeds/coupons.json',
  '/api/feeds/offers',
  '/api/feeds/otherpromo.json',
  '/api/feeds/store-products.json',
  '/api/feeds/store-products.xml',
  '/api/feeds/stacks.json',
  '/api/feeds/stacks.xml',
];

const DISALLOW_INTERNAL = [
  '/admin/',
  '/api/admin/',
  '/api/vouchers/track',
  '/api/store-products/track',
  '/api/cron/',
  
  // Internal APIs
  '/api/stores', '/api/stores/*', '/api/categories', '/api/categories/*', 
  '/api/vouchers', '/api/vouchers/*', '/api/countries', '/api/homepage', 
  '/api/search', '/api/stacks', '/api/blog', '/api/blog/*', 
  '/api/curated-offers', '/api/seasonal/*', '/api/leaderboard', '/api/og', 
  '/api/slug-translate', // ✅ FIX 2: Removed redundant /api/translate-slug

  // Dynamic / tracking endpoints
  '/*/search', '/*/search?*',
  '/_next/', '/store-covers/', '/public/stores/', '/favicon.ico',
  
  // ✅ FIX 3: Removed dead locales from here (handled gracefully by 404s, prevents bot overlap)
  
  // ✅ FIX 4: Removed /*.json$ to prevent conflicting with API feed crawlability
  '/*.js$', '/*.css$', '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$', '/*.jpeg$', 
  '/*.woff$', '/*.woff2$', '/*.ttf$',
  '/*?ref=*', '/*?utm_*', '/*?source=*', '/*?fbclid=*', '/*?gclid=*',
];

export default function robots() {
  return {
    rules: [
      {
        userAgent:  'Googlebot',
        allow:      [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:   DISALLOW_INTERNAL,
        // ✅ FIX 5: Removed invalid crawlDelay: 0
      },
      {
        userAgent: 'Googlebot-Image',
        disallow: ['/', '/store-covers/', '/public/stores/', '/_next/static/'],
      },
      {
        userAgent:  'Bingbot',
        allow:      [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:   DISALLOW_INTERNAL,
        // ✅ FIX 5: Removed invalid crawlDelay: 0
      },
      {
        userAgent: '*',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  DISALLOW_INTERNAL,
      },
      { userAgent: 'AhrefsBot',   disallow: '/', crawlDelay: 10 },
      { userAgent: 'SemrushBot',  disallow: '/', crawlDelay: 10 },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },
      {
        userAgent: 'GPTBot',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/', '/api/vouchers/track', '/api/store-products/track'],
      },
      {
        userAgent: 'CCBot',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Claude-Web',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Google-Extended',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'FacebookBot',
        allow:     ALLOW_PAGES,
        disallow:  ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow:     ALLOW_PAGES,
        disallow:  ['/admin/', '/api/'],
      },
    ],
    // ✅ FIX 6: Restricted strictly to the XML sitemap. Removed JSON/API endpoint misuse.
    sitemap: [`${BASE_URL}/sitemap.xml`],
    host: BASE_URL,
  };
}
