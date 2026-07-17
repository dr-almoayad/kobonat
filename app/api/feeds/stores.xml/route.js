// app/api/feeds/stores.xml/route.js
import { prisma } from '@/lib/prisma';
import { escapeXml, xmlTag, bilingualTags, isoDate, xmlHeader, xmlFooter, xmlResponse, xmlErrorResponse }
  from '@/lib/feeds/xmlHelpers';

export const dynamic = 'force-dynamic'; // ✅ Prevents static generation
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA', isActive: true } } },
      },
      include: {
        translations: { where: { locale: { in: ['ar', 'en'] } } },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
    });

    const items = stores.map(store => {
      const ar = store.translations.find(t => t.locale === 'ar') || {};
      const en = store.translations.find(t => t.locale === 'en') || {};
      const urlAr = ar.slug ? `${BASE_URL}/ar-SA/stores/${encodeURIComponent(ar.slug)}` : '';
      const urlEn = en.slug ? `${BASE_URL}/en-SA/stores/${encodeURIComponent(en.slug)}` : '';

      return [
        '  <store>',
        `    ${xmlTag('id', store.id)}`,
        `    ${bilingualTags('name', ar.name || '', en.name || '')}`,
        `    ${bilingualTags('slug', ar.slug || '', en.slug || '')}`,
        `    ${bilingualTags('page_url', urlAr, urlEn)}`,
        ar.description || en.description
          ? `    ${bilingualTags('description', ar.description || '', en.description || '')}`
          : '',
        `    ${xmlTag('website_url', store.websiteUrl || '')}`,
        `    ${xmlTag('logo', store.logo || '')}`,
        `    ${xmlTag('is_featured', store.isFeatured ? '1' : '0')}`,
        `    ${xmlTag('lastmod', isoDate(store.updatedAt))}`,
        '  </store>',
      ]
        .filter(line => line !== '')
        .join('\n');
    });

    const xml = [
      xmlHeader('stores', stores.length),
      items.join('\n'),
      xmlFooter('stores'),
    ].join('\n');

    return xmlResponse(xml);
  } catch (error) {
    console.error('[GET /api/feeds/stores.xml]', error);
    return xmlErrorResponse('Failed to generate stores feed');
  }
}
