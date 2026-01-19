// app/robots.txt/route.js
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export async function GET() {
  const robotsTxt = `# Robots.txt for Coupons Platform
  
User-agent: *
Allow: /

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Disallow admin routes
Disallow: /admin/
Disallow: /api/admin/

# Disallow auth routes
Disallow: /*/auth/

# Allow specific API routes for search engines
Allow: /api/stores
Allow: /api/categories
Allow: /api/vouchers

# Crawl-delay (optional, adjust based on server capacity)
Crawl-delay: 1

# Specific bot rules
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block bad bots (optional)
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}