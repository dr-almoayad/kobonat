// lib/seo/dynamicStoreTitle.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates authoritative, SEO-optimised titles and H1s for Saudi store pages.
// All Arabic copy uses a formal, expert-authority register — never casual.
// Titles are stable — no monthly‑rotating dates to avoid false freshness signals.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary page <title>, meta description, and H1 for a store's coupon page.
 *
 * Arabic title format (stable):
 *   كوبونات وعروض {Store} - توفير يصل إلى {maxSavings}٪
 *   (when maxSavings is 0 / unknown the savings clause is omitted)
 *
 * English title format (stable):
 *   {Store} Coupons & Deals — Save up to {maxSavings}%
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
    // ── Title (stable – no month) ──
    const savingsPart = savings ? ` - توفير يصل إلى ${savings}٪` : '';
    const title = `كوبونات وعروض ${storeName}${savingsPart}`;

    // ── H1 (shown on‑page – stable) ──
    const h1 = `كوبونات وعروض ${storeName}`;

    // ── Description (does not mention a specific month; uses "محدثة باستمرار") ──
    const description = count && savings
      ? `احصل على ${count}+ كوبون فعّال لـ${storeName}. توفير يصل إلى ${savings}٪ — خصومات مجرّبة وموثّقة، محدّثة باستمرار.`
      : count
        ? `احصل على ${count}+ كوبون فعّال لـ${storeName}. خصومات مجرّبة وموثّقة — جرّبها مجاناً، محدّثة يومياً.`
        : savings
          ? `أحدث كوبونات ${storeName} مع توفير يصل إلى ${savings}٪ — خصومات مجرّبة وموثّقة في المملكة.`
          : `أحدث كوبونات ${storeName} — خصومات مجرّبة وموثّقة، سواء طلبت من الرياض، جدة أو أي مدينة في المملكة.`;

    return { title, h1, description };
  }

  // ── English (stable – no month) ──
  const savingsPart = savings ? ` — Save up to ${savings}%` : '';
  const title = `${storeName} Coupons & Deals${savingsPart}`;

  const h1 = `${storeName} Coupons & Deals`;

  const description = count && savings
    ? `Find ${count}+ verified ${storeName} discount codes. Save up to ${savings}% — tested and confirmed, updated regularly.`
    : count
      ? `Find ${count}+ verified ${storeName} coupon codes. Exclusive deals tested and confirmed daily.`
      : savings
        ? `Latest ${storeName} coupon codes with up to ${savings}% off — verified discounts updated daily.`
        : `Latest ${storeName} coupon codes — verified discounts, free shipping offers and exclusive deals, updated regularly.`;

  return { title, h1, description };
}

/**
 * Short hero sub-heading displayed beneath H1.
 * Stable – does not include month.
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
    if (maxSavings)  parts.push(`توفير يصل إلى ${Math.round(maxSavings)}٪`);
    parts.push('محدّث يومياً');
    return parts.join(' • ');
  }

  const parts = [];
  if (codeCount)  parts.push(`${codeCount} active codes`);
  if (maxSavings) parts.push(`Save up to ${Math.round(maxSavings)}%`);
  parts.push('Updated daily');
  return parts.join(' • ');
}
