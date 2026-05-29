// app/api/feeds/offers.xml/route.js
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feeds/offers
//
// Produces an XML feed of the top 500 active bank/payment/card/seasonal promos
// available in Saudi Arabia.  Includes bank name, payment method, card details,
// and store linkage so aggregators can map each offer to a merchant.
//
// Cache: 1 hour at the CDN edge.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }                                from '@/lib/prisma';
import { escapeXml, xmlTag, bilingualTags, isoDate, xmlHeader, xmlFooter, xmlResponse, xmlErrorResponse }
  from '@/lib/feeds/xmlHelpers';

// Revalidate every hour — bank promos change less often than vouchers
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LIMIT    = 500;

// ── Human-readable promo type labels ─────────────────────────────────────────
const PROMO_TYPE_LABEL = {
  BANK_OFFER:     { ar: 'عرض بنكي',          en: 'Bank Offer'          },
  CARD_OFFER:     { ar: 'عرض بطاقة',         en: 'Card Offer'          },
  PAYMENT_OFFER:  { ar: 'عرض وسيلة الدفع',   en: 'Payment Method Offer'},
  SEASONAL:       { ar: 'عرض موسمي',          en: 'Seasonal Offer'      },
  BUNDLE:         { ar: 'عرض مجمّع',          en: 'Bundle Offer'        },
  OTHER:          { ar: 'عرض آخر',            en: 'Other Offer'         },
};

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // ── 1. Query ──────────────────────────────────────────────────────────────
    // OtherPromo has a direct countryId FK (not a junction table like Voucher),
    // so we join via the country relation.
    const promos = await prisma.otherPromo.findMany({
      where: {
        isActive: true,
        country: { code: 'SA' },   // Direct relation — one promo = one country
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      include: {
        // Promo translations
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
        },
        // Bank (optional)
        bank: {
          include: {
            translations: {
              where: { locale: { in: ['ar', 'en'] } },
            },
          },
        },
        // Payment method (optional — e.g. Mada, Visa, Tabby, Tamara)
        paymentMethod: {
          include: {
            translations: {
              where: { locale: { in: ['ar', 'en'] } },
            },
          },
        },
        // Card (optional — tier / network details)
        card: {
          include: {
            translations: {
              where: { locale: { in: ['ar', 'en'] } },
            },
          },
        },
        // Linked store (optional — promo may apply to a specific merchant)
        store: {
          include: {
            translations: {
              where: { locale: { in: ['ar', 'en'] } },
            },
          },
        },
      },
      orderBy: [
        { order:     'asc'  },
        { createdAt: 'desc' },
      ],
      take: LIMIT,
    });

    // ── 2. Build XML ──────────────────────────────────────────────────────────
    const items = promos.map(promo => {
      // Promo translations
      const ptAr = promo.translations.find(t => t.locale === 'ar') || {};
      const ptEn = promo.translations.find(t => t.locale === 'en') || {};

      // Bank translations
      const bankAr = promo.bank?.translations.find(t => t.locale === 'ar') || {};
      const bankEn = promo.bank?.translations.find(t => t.locale === 'en') || {};

      // Payment method translations
      const pmAr = promo.paymentMethod?.translations.find(t => t.locale === 'ar') || {};
      const pmEn = promo.paymentMethod?.translations.find(t => t.locale === 'en') || {};

      // Card translations
      const cardAr = promo.card?.translations.find(t => t.locale === 'ar') || {};
      const cardEn = promo.card?.translations.find(t => t.locale === 'en') || {};

      // Store translations
      const stAr = promo.store?.translations.find(t => t.locale === 'ar') || {};
      const stEn = promo.store?.translations.find(t => t.locale === 'en') || {};

      // Store canonical page URLs
      const storeUrlAr = stAr.slug
        ? `${BASE_URL}/ar-SA/stores/${encodeURIComponent(stAr.slug)}`
        : '';
      const storeUrlEn = stEn.slug
        ? `${BASE_URL}/en-SA/stores/${encodeURIComponent(stEn.slug)}`
        : '';

      const typeLabelAr = PROMO_TYPE_LABEL[promo.type]?.ar || promo.type;
      const typeLabelEn = PROMO_TYPE_LABEL[promo.type]?.en || promo.type;

      return [
        '  <offer>',
        `    ${xmlTag('id', promo.id)}`,
        `    ${xmlTag('type', promo.type)}`,
        `    ${bilingualTags('type_label', typeLabelAr, typeLabelEn)}`,

        // Titles (bilingual)
        `    ${bilingualTags('title', ptAr.title || '', ptEn.title || '')}`,

        // Descriptions (bilingual, optional)
        ptAr.description || ptEn.description
          ? `    ${bilingualTags('description', ptAr.description || '', ptEn.description || '')}`
          : '',

        // Terms (bilingual, optional — e.g. "Min spend SAR 200")
        ptAr.terms || ptEn.terms
          ? `    ${bilingualTags('terms', ptAr.terms || '', ptEn.terms || '')}`
          : '',

        // Discount signals
        promo.discountPercent != null
          ? `    ${xmlTag('discount_percent', String(promo.discountPercent))}`
          : '',
        promo.verifiedAvgPercent != null
          ? `    ${xmlTag('verified_avg_percent', String(promo.verifiedAvgPercent))}`
          : '',

        // Spend constraints
        promo.minSpendAmount != null
          ? `    ${xmlTag('min_spend', String(promo.minSpendAmount))}`
          : '',
        promo.maxDiscountAmount != null
          ? `    ${xmlTag('max_discount_amount', String(promo.maxDiscountAmount))}`
          : '',

        // Voucher code embedded in promo (some bank offers come with a code)
        promo.voucherCode
          ? `    ${xmlTag('voucher_code', promo.voucherCode)}`
          : '',

        // Dates
        promo.startDate
          ? `    ${xmlTag('start_date', isoDate(promo.startDate))}`
          : '',
        promo.expiryDate
          ? `    ${xmlTag('expiry_date', isoDate(promo.expiryDate))}`
          : '    <expiry_date/>',

        // Promo image and URL
        promo.image
          ? `    ${xmlTag('image', promo.image)}`
          : '',
        `    ${xmlTag('url', promo.url || '')}`,

        // ── Bank block (omit entirely if no bank) ───────────────────────────
        promo.bank
          ? [
              '    <bank>',
              `      ${xmlTag('id', promo.bank.id)}`,
              `      ${xmlTag('slug', promo.bank.slug)}`,
              `      ${bilingualTags('name', bankAr.name || '', bankEn.name || '')}`,
              `      ${xmlTag('logo', promo.bank.logo || '')}`,
              `      ${xmlTag('type', promo.bank.type || '')}`,
              '    </bank>',
            ].join('\n')
          : '',

        // ── Payment method block (omit if no payment method) ────────────────
        promo.paymentMethod
          ? [
              '    <payment_method>',
              `      ${xmlTag('id', promo.paymentMethod.id)}`,
              `      ${xmlTag('slug', promo.paymentMethod.slug)}`,
              `      ${bilingualTags('name', pmAr.name || '', pmEn.name || '')}`,
              `      ${xmlTag('type', promo.paymentMethod.type || '')}`,
              `      ${xmlTag('is_bnpl', promo.paymentMethod.isBnpl ? '1' : '0')}`,
              `      ${xmlTag('logo', promo.paymentMethod.logo || '')}`,
              '    </payment_method>',
            ].join('\n')
          : '',

        // ── Card block (omit if no card) ────────────────────────────────────
        promo.card
          ? [
              '    <card>',
              `      ${xmlTag('id', promo.card.id)}`,
              `      ${bilingualTags('name', cardAr.name || '', cardEn.name || '')}`,
              `      ${xmlTag('network', promo.card.network || '')}`,
              `      ${xmlTag('tier', promo.card.tier || '')}`,
              promo.card.image
                ? `      ${xmlTag('image', promo.card.image)}`
                : '',
              '    </card>',
            ]
              .filter(Boolean)
              .join('\n')
          : '',

        // ── Store block (omit if global / not store-specific) ───────────────
        promo.store
          ? [
              '    <store>',
              `      ${xmlTag('id', promo.store.id)}`,
              `      ${bilingualTags('name', stAr.name || '', stEn.name || '')}`,
              `      ${bilingualTags('page_url', storeUrlAr, storeUrlEn)}`,
              `      ${xmlTag('logo', promo.store.logo || '')}`,
              '    </store>',
            ].join('\n')
          : '',

        `    ${xmlTag('lastmod', isoDate(promo.updatedAt))}`,
        '  </offer>',
      ]
        .filter(line => line !== '')
        .join('\n');
    });

    const xml = [
      xmlHeader('offers', promos.length),
      items.join('\n'),
      xmlFooter('offers'),
    ].join('\n');

    return xmlResponse(xml, 3600);

  } catch (error) {
    console.error('[GET /api/feeds/offers]', error);
    return xmlErrorResponse('Failed to generate offers feed');
  }
}
