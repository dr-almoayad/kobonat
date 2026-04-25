// app/robots.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export default function robots() {
  return {
    rules: [
      // ── Default: allow everything except sensitive routes ────────────────
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
          '/*/bank-and-payment-offers', // <-- added new route
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/',
          '/*/auth/',
          '/*/search',
          '/*/search?*',
          '/*/blog?page=6',
          '/*/blog?page=7',
          '/*/blog?page=8',
          '/*/blog?page=9',
          '/*/coupons?page=1[0-9]',
          '/*/coupons?page=[2-9][0-9]',
          '/*/stacks?page=1[0-9]',
          '/*/stacks?page=[2-9][0-9]',
          '/*?ref=*',
          '/*?utm_*',
          '/*?source=*',
          '/*?fbclid=*',
        ],
      },

      // ── Googlebot: explicit permissions, no crawl delay ─────────────────
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
          '/admin/',
          '/api/',
          '/*/search',
          '/*/search?*',
          '/*/auth/',
        ],
        crawlDelay: 0,
      },

      // ── Bingbot ──────────────────────────────────────────────────────────
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/*/search',
          '/*/search?*',
        ],
        crawlDelay: 1,
      },

      // ── SEO crawlers — slow them down to protect server ──────────────────
      {
        userAgent: 'AhrefsBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/*/search'],
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/*/search'],
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

      // ── AI training crawlers — disallow ──────────────────────────────────
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'FacebookBot',
        disallow: '/',
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`, // <-- explicit sitemap location
    host: BASE_URL,
  };
}
