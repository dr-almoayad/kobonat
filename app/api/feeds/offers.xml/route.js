// app/api/feeds/offers.xml/route.js
import { prisma } from '@/lib/prisma';
import { escapeXml, xmlTag, bilingualTags, isoDate, xmlHeader, xmlFooter, xmlResponse, xmlErrorResponse }
  from '@/lib/feeds/xmlHelpers';

export const dynamic = 'force-dynamic'; // ✅ Prevents static generation
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LIMIT = 500;

const PROMO_TYPE_LABEL = {
  BANK_OFFER:     { ar: 'عرض بنكي',          en: 'Bank Offer'          },
  CARD_OFFER:     { ar: 'عرض بطاقة',         en: 'Card Offer'          },
  PAYMENT_OFFER:  { ar: 'عرض وسيلة الدفع',   en: 'Payment Method Offer'},
  SEASONAL:       { ar: 'عرض موسمي',          en: 'Seasonal Offer'      },
  BUNDLE:         { ar: 'عرض مجمّع',          en: 'Bundle Offer'        },
  OTHER:          { ar: 'عرض آخر',            en: 'Other Offer'         },
};

export async function GET() {
  try {
    const promos = await prisma.otherPromo.findMany({
      where: {
        isActive: true,
        country: { code: 'SA' },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      include: {
        translations: { where: { locale: { in: ['ar', 'en'] } } },
        bank: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        paymentMethod: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        card: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        store: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: LIMIT,
    });

    const items = promos.map(promo => {
      // ... same as your existing code ...
      // (unchanged)
    });

    const xml = [
      xmlHeader('offers', promos.length),
      items.join('\n'),
      xmlFooter('offers'),
    ].join('\n');

    return xmlResponse(xml, 3600);
  } catch (error) {
    console.error('[GET /api/feeds/offers.xml]', error);
    return xmlErrorResponse('Failed to generate offers feed');
  }
}
