// lib/seo/dynamicStoreTitle.js
// Generates SEO‑optimised titles and H1s for Saudi store pages.
// Format: "عروض واكواد خصم [Store] - وفر [savings]%" (Arabic)
//         "[Store] Coupons & Deals - Save [savings]%" (English)
// No month/year to avoid false freshness signals.

/**
 * Primary page <title>, meta description, and H1 for a store's coupon page.
 *
 * Arabic title format:
 *   عروض واكواد خصم {Store} - وفر {maxSavings}%
 *   (savings clause omitted when 0 / unknown)
 *
 * English title format:
 *   {Store} Coupons & Deals - Save {maxSavings}%
 *   (savings clause omitted when 0 / unknown)
 *
 * @param {object}  opts
 * @param {string}  opts.storeName    - Localised store name
 * @param {string}  opts.locale       - Full locale string e.g. "ar-SA"
 * @param {number}  [opts.codeCount]  - Number of active codes (optional)
 * @param {number}  [opts.maxSavings] - Max savings % (optional, 0 = unknown)
 * @returns {{ title: string, description: string, h1: string }}
 */
export function generateStorePageTitle({
  storeName,
  locale,
  codeCount,
  maxSavings = 0,
}) {
  const lang    = (locale || 'ar').split('-')[0];
  const isAr    = lang === 'ar';
  const count   = codeCount && codeCount > 0 ? codeCount : null;
  const savings = maxSavings && maxSavings > 0 ? Math.round(maxSavings) : null;

  if (isAr) {
    // ── Title ──
    const savingsPart = savings ? ` - وفر ${savings}%` : '';
    const title = `عروض واكواد خصم ${storeName}${savingsPart}`;

    // ── H1 ── (shown on‑page – slightly fuller)
    const h1 = `عروض واكواد خصم ${storeName}`;

    // ── Description ──
    const description = count && savings
      ? `احصل على ${count}+ كود خصم فعّال لـ${storeName}. وفر ${savings}٪ على مشترياتك — خصومات مجرّبة وموثّقة.`
      : count
        ? `احصل على ${count}+ كود خصم فعّال لـ${storeName}. خصومات مجرّبة وموثّقة — جرّبها مجاناً.`
        : savings
          ? `أحدث عروض وأكواد خصم ${storeName} مع توفير يصل إلى ${savings}٪ — خصومات مجرّبة وموثّقة في المملكة.`
          : `أحدث عروض وأكواد خصم ${storeName} — خصومات مجرّبة وموثّقة، سواء طلبت من الرياض، جدة أو أي مدينة في المملكة.`;

    return { title, h1, description };
  }

  // ── English ──
  const savingsPart = savings ? ` - Save ${savings}%` : '';
  const title = `${storeName} Coupons & Deals${savingsPart}`;

  const h1 = `${storeName} Coupons & Deals`;

  const description = count && savings
    ? `Get ${count}+ verified ${storeName} discount codes. Save ${savings}% on your purchases — tested and confirmed.`
    : count
      ? `Get ${count}+ verified ${storeName} coupon codes. Exclusive deals tested and confirmed daily.`
      : savings
        ? `Latest ${storeName} coupon codes with up to ${savings}% off — verified discounts updated regularly.`
        : `Latest ${storeName} coupon codes — verified discounts, free shipping offers and exclusive deals, updated regularly.`;

  return { title, h1, description };
}

/**
 * Short hero sub-heading displayed beneath H1.
 * Stable – no month.
 */
export function generateStoreHeroSubtitle({
  storeName,
  codeCount,
  maxSavings,
  locale,
}) {
  const lang  = (locale || 'ar').split('-')[0];
  const isAr  = lang === 'ar';

  if (isAr) {
    const parts = [];
    if (codeCount)   parts.push(`${codeCount} كود نشط`);
    if (maxSavings)  parts.push(`وفر حتى ${Math.round(maxSavings)}%`);
    parts.push('محدّث يومياً');
    return parts.join(' • ');
  }

  const parts = [];
  if (codeCount)  parts.push(`${codeCount} active codes`);
  if (maxSavings) parts.push(`Save up to ${Math.round(maxSavings)}%`);
  parts.push('Updated daily');
  return parts.join(' • ');
}
