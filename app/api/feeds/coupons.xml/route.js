// app/api/feeds/coupons.xml/route.js 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feeds/coupons
//
// Produces an XML feed of the top 1 000 active vouchers (codes, deals, and
// free-shipping offers) available in Saudi Arabia, ordered by popularity.
//
// Suitable for:
//   • Google Merchant Center promotions feed (unofficial — structure is custom)
//   • Affiliate network aggregators
//   • Partner websites that want to pull live coupon data
//
// Cache: 30 minutes at the CDN edge — vouchers change frequently.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }                                from '@/lib/prisma';
import { escapeXml, xmlTag, bilingualTags, isoDate, xmlHeader, xmlFooter, xmlResponse, xmlErrorResponse }
  from '@/lib/feeds/xmlHelpers';

// Revalidate every 30 minutes — coupons expire faster than stores change
export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LIMIT    = 1000;

// ── Human-readable type labels (both languages) ───────────────────────────────
const TYPE_LABEL = {
  CODE:          { ar: 'كود خصم',    en: 'Discount Code'    },
  DEAL:          { ar: 'عرض',        en: 'Deal'             },
  FREE_SHIPPING: { ar: 'شحن مجاني',  en: 'Free Shipping'    },
};

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // ── 1. Query ──────────────────────────────────────────────────────────────
    const vouchers = await prisma.voucher.findMany({
      where: {
        // Active (non-expired)
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
        // Available in Saudi Arabia
        countries: {
          some: { country: { code: 'SA' } },
        },
        // Store must be active
        store: { isActive: true },
      },
      include: {
        // Both locale translations in one round-trip
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
        },
        // Store details + its own translations
        store: {
          include: {
            translations: {
              where: { locale: { in: ['ar', 'en'] } },
            },
          },
        },
      },
      orderBy: [
        { isExclusive:     'desc' },
        { isVerified:      'desc' },
        { popularityScore: 'desc' },
        { createdAt:       'desc' },
      ],
      take: LIMIT,
    });

    // ── 2. Build XML ──────────────────────────────────────────────────────────
    const items = vouchers.map(voucher => {
      // Voucher translations
      const vtAr = voucher.translations.find(t => t.locale === 'ar') || {};
      const vtEn = voucher.translations.find(t => t.locale === 'en') || {};

      // Store translations
      const stAr = voucher.store?.translations.find(t => t.locale === 'ar') || {};
      const stEn = voucher.store?.translations.find(t => t.locale === 'en') || {};

      // Store canonical page URLs
      const storeUrlAr = stAr.slug
        ? `${BASE_URL}/ar-SA/stores/${encodeURIComponent(stAr.slug)}`
        : '';
      const storeUrlEn = stEn.slug
        ? `${BASE_URL}/en-SA/stores/${encodeURIComponent(stEn.slug)}`
        : '';

      // Discount display string (e.g. "20%" or "50 SAR" or the free-text field)
      const discountDisplay = buildDiscountDisplay(voucher);

      // Type label
      const typeLabelAr = TYPE_LABEL[voucher.type]?.ar || voucher.type;
      const typeLabelEn = TYPE_LABEL[voucher.type]?.en || voucher.type;

      return [
        '  <coupon>',
        `    ${xmlTag('id', voucher.id)}`,
        `    ${xmlTag('type', voucher.type)}`,
        `    ${bilingualTags('type_label', typeLabelAr, typeLabelEn)}`,

        // Voucher code — only present for CODE type
        voucher.code
          ? `    ${xmlTag('code', voucher.code)}`
          : '    <code/>',

        // Titles (bilingual)
        `    ${bilingualTags('title', vtAr.title || '', vtEn.title || '')}`,

        // Descriptions (bilingual, optional)
        vtAr.description || vtEn.description
          ? `    ${bilingualTags('description', vtAr.description || '', vtEn.description || '')}`
          : '',

        // Discount signals
        discountDisplay
          ? `    ${xmlTag('discount', discountDisplay)}`
          : '',
        voucher.discountPercent != null
          ? `    ${xmlTag('discount_percent', String(voucher.discountPercent))}`
          : '',
        voucher.verifiedAvgPercent != null
          ? `    ${xmlTag('verified_avg_percent', String(voucher.verifiedAvgPercent))}`
          : '',

        // Minimum spend / cap
        voucher.minSpendAmount != null
          ? `    ${xmlTag('min_spend', String(voucher.minSpendAmount))}`
          : '',
        voucher.maxDiscountAmount != null
          ? `    ${xmlTag('max_discount_amount', String(voucher.maxDiscountAmount))}`
          : '',

        // Quality signals
        `    ${xmlTag('is_exclusive', voucher.isExclusive  ? '1' : '0')}`,
        `    ${xmlTag('is_verified',  voucher.isVerified   ? '1' : '0')}`,
        `    ${xmlTag('popularity',   String(voucher.popularityScore || 0))}`,

        // Dates
        voucher.startDate
          ? `    ${xmlTag('start_date', isoDate(voucher.startDate))}`
          : '',
        voucher.expiryDate
          ? `    ${xmlTag('expiry_date', isoDate(voucher.expiryDate))}`
          : '    <expiry_date/>',

        // Landing URL (the affiliate / offer URL)
        `    ${xmlTag('offer_url', voucher.landingUrl || '')}`,

        // Store details
        `    <store>`,
        `      ${xmlTag('id', voucher.store?.id || '')}`,
        `      ${bilingualTags('name', stAr.name || '', stEn.name || '')}`,
        `      ${bilingualTags('page_url', storeUrlAr, storeUrlEn)}`,
        `      ${xmlTag('logo', voucher.store?.logo || '')}`,
        `    </store>`,

        `    ${xmlTag('lastmod', isoDate(voucher.updatedAt))}`,
        '  </coupon>',
      ]
        .filter(line => line !== '')
        .join('\n');
    });

    const xml = [
      xmlHeader('coupons', vouchers.length),
      items.join('\n'),
      xmlFooter('coupons'),
    ].join('\n');

    return xmlResponse(xml, 1800); // 30-minute cache

  } catch (error) {
    console.error('[GET /api/feeds/coupons]', error);
    return xmlErrorResponse('Failed to generate coupons feed');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a human-readable discount display string.
 * Examples: "20%", "50 SAR", "Free Shipping", "Up to 20%"
 */
function buildDiscountDisplay(voucher) {
  if (voucher.type === 'FREE_SHIPPING') return 'Free Shipping';

  // Prefer the free-text `discount` field the admin sets (e.g. "Up to 30%")
  if (voucher.discount) return voucher.discount;

  // Fall back to the numeric field
  if (voucher.discountPercent != null) return `${voucher.discountPercent}%`;

  return '';
}
