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
        ],
        disallow: [
          // Admin & API
          '/admin/',
          '/api/admin/',
          '/api/',

          // Auth routes
          '/*/auth/',

          // Search — all variations
          // The search page sets noindex in metadata but we also block
          // crawling here to avoid wasting crawl budget on dynamic
          // query-string pages that are never in the sitemap.
          '/*/search',
          '/*/search?*',

          // Paginated blog beyond page 5 — Google can still find deeper
          // pages through internal links; blocking prevents crawl budget
          // waste on low-signal paginated pages.
          '/*/blog?page=6',
          '/*/blog?page=7',
          '/*/blog?page=8',
          '/*/blog?page=9',

          // Paginated coupons beyond page 10 — the sitemap only includes
          // page 1; deeper pages are reachable via rel="next" chains.
          '/*/coupons?page=1[0-9]',
          '/*/coupons?page=[2-9][0-9]',

          // Stacks pagination — same rationale as coupons
          '/*/stacks?page=1[0-9]',
          '/*/stacks?page=[2-9][0-9]',

          // Prevent indexing of any URL with common tracking/filter params
          // that create near-duplicate content
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

    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
