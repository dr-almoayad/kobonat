// app/robots.js
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export default function robots() {
  return {
    rules: [
      // ── Default: allow everything except admin/api-admin/auth ───────────
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/*/auth/',
          // Block paginated blog pages beyond page 5 to avoid crawl budget waste.
          // Google can still discover deeper pages via internal links.
          '/*/blog?page=',
        ],
      },
      // ── Googlebot: no crawl delay, full access ──────────────────────────
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/*/blog',
          '/*/blog/',
        ],
        crawlDelay: 0,
      },
      // ── Bingbot ─────────────────────────────────────────────────────────
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
      // ── SEO crawlers — slow them down to protect server ─────────────────
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
      },
      // ── AI training crawlers — disallow ─────────────────────────────────
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
    ],
    // Sitemap index — single sitemap for now; split when > 45k entries
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
