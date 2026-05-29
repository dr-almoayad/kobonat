// app/api/feeds/stores.xml/route.js
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feeds/stores
//
// Produces an XML feed listing every active store available in Saudi Arabia,
// with both Arabic and English names/slugs so aggregators and Google Merchant
// can index all localised versions in one request.
//
// Cache: 1 hour at the CDN edge (revalidate = 3600).
//        Stale-while-revalidate keeps the feed available during DB rebuilds.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }                                from '@/lib/prisma';
import { escapeXml, xmlTag, bilingualTags, isoDate, xmlHeader, xmlFooter, xmlResponse, xmlErrorResponse }
  from '@/lib/feeds/xmlHelpers';

// Next.js App Router route segment config — revalidate every hour
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // ── 1. Fetch all active SA stores with both translations ─────────────────
    const stores = await prisma.store.findMany({
      where: {
        isActive:  true,
        countries: {
          some: {
            country: { code: 'SA', isActive: true },
          },
        },
      },
      include: {
        // Pull ar + en translations in a single query
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { id:         'asc'  },
      ],
    });

    // ── 2. Build XML ──────────────────────────────────────────────────────────
    const items = stores.map(store => {
      const ar = store.translations.find(t => t.locale === 'ar') || {};
      const en = store.translations.find(t => t.locale === 'en') || {};

      // Canonical page URLs for each locale
      const urlAr = ar.slug ? `${BASE_URL}/ar-SA/stores/${encodeURIComponent(ar.slug)}` : '';
      const urlEn = en.slug ? `${BASE_URL}/en-SA/stores/${encodeURIComponent(en.slug)}` : '';

      return [
        '  <store>',
        `    ${xmlTag('id', store.id)}`,

        // Bilingual names
        `    ${bilingualTags('name', ar.name || '', en.name || '')}`,

        // Bilingual slugs
        `    ${bilingualTags('slug', ar.slug || '', en.slug || '')}`,

        // Bilingual canonical page URLs
        `    ${bilingualTags('page_url', urlAr, urlEn)}`,

        // Bilingual descriptions (optional — many stores won't have both)
        ar.description || en.description
          ? `    ${bilingualTags('description', ar.description || '', en.description || '')}`
          : '',

        // Website / affiliate target URL
        `    ${xmlTag('website_url', store.websiteUrl || '')}`,

        // Logo — single global asset, no locale variant
        `    ${xmlTag('logo', store.logo || '')}`,

        // Signals
        `    ${xmlTag('is_featured', store.isFeatured ? '1' : '0')}`,

        // Timestamps
        `    ${xmlTag('lastmod', isoDate(store.updatedAt))}`,

        '  </store>',
      ]
        .filter(line => line !== '') // Drop empty optional lines
        .join('\n');
    });

    const xml = [
      xmlHeader('stores', stores.length),
      items.join('\n'),
      xmlFooter('stores'),
    ].join('\n');

    return xmlResponse(xml);

  } catch (error) {
    console.error('[GET /api/feeds/stores]', error);
    return xmlErrorResponse('Failed to generate stores feed');
  }
}
