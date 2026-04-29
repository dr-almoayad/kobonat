// lib/seo/dynamicStoreTitle.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates authoritative, SEO-optimised titles and H1s for Saudi store pages.
// All Arabic copy uses a formal, expert-authority register — never casual.
// Month/year update automatically with no stale strings.
// ─────────────────────────────────────────────────────────────────────────────

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو',
  'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر',
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getCurrentMonthYearAr(date = new Date()) {
  return `${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getCurrentMonthYearEn(date = new Date()) {
  return `${ENGLISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// ── Title generators ──────────────────────────────────────────────────────────

/**
 * Primary page <title>, meta description, and H1 for a store's coupon page.
 *
 * Arabic title format:
 *   كوبونات وعروض {Store} - توفير يصل إلى {maxSavings}٪ | محدّث {Month Year}
 *   (when maxSavings is 0 / unknown the savings clause is omitted)
 *
 * English title format:
 *   {Store} Coupons & Deals — Save up to {maxSavings}% | Updated {Month Year}
 *   (savings clause omitted when 0 / unknown)
 *
 * @param {object}  opts
 * @param {string}  opts.storeName    - Localised store name
 * @param {string}  opts.locale       - Full locale string e.g. "ar-SA"
 * @param {number}  [opts.codeCount]  - Number of active codes (optional)
 * @param {number}  [opts.maxSavings] - Max savings % (optional, 0 = unknown)
 * @param {Date}    [opts.date]       - Override date (defaults to now)
 * @returns {{ title: string, description: string, h1: string }}
 */
export function generateStorePageTitle({
  storeName,
  locale,
  codeCount,
  maxSavings = 0,
  date = new Date(),
}) {
  const lang    = (locale || 'ar').split('-')[0];
  const isAr    = lang === 'ar';
  const monthYr = isAr ? getCurrentMonthYearAr(date) : getCurrentMonthYearEn(date);
  const count   = codeCount && codeCount > 0 ? codeCount : null;
  const savings = maxSavings && maxSavings > 0 ? Math.round(maxSavings) : null;

  if (isAr) {
    // ── Title ──
    const savingsPart = savings ? ` - توفير يصل إلى ${savings}٪` : '';
    const title = `كوبونات وعروض ${storeName}${savingsPart} | محدّث ${monthYr}`;

    // ── H1 ── (shown on-page — slightly fuller)
    const h1 = `كوبونات وعروض ${storeName} - ${monthYr}`;

    // ── Description ──
    const description = count && savings
      ? `احصل على ${count}+ كوبون فعّال لـ${storeName} محدّث ${monthYr}. توفير يصل إلى ${savings}٪ — خصومات مجرّبة وموثّقة.`
      : count
        ? `احصل على ${count}+ كوبون فعّال لـ${storeName} محدّث ${monthYr}. خصومات مجرّبة وموثّقة — جرّبها مجاناً.`
        : savings
          ? `أحدث كوبونات ${storeName} لشهر ${monthYr}. توفير يصل إلى ${savings}٪ — خصومات مجرّبة وموثّقة في المملكة.`
          : `أحدث كوبونات ${storeName} لشهر ${monthYr}. خصومات مجرّبة وموثّقة — سواء طلبت من الرياض، جدة أو أي مدينة في المملكة.`;

    return { title, h1, description };
  }

  // ── English ──
  const savingsPart = savings ? ` — Save up to ${savings}%` : '';
  const title = `${storeName} Coupons & Deals${savingsPart} | Updated ${monthYr}`;

  const h1 = `${storeName} Coupons & Deals — ${monthYr}`;

  const description = count && savings
    ? `Find ${count}+ verified ${storeName} discount codes updated ${monthYr}. Save up to ${savings}% — tested and confirmed.`
    : count
      ? `Find ${count}+ verified ${storeName} coupon codes updated ${monthYr}. Exclusive deals tested and confirmed daily.`
      : savings
        ? `Latest ${storeName} coupon codes for ${monthYr}. Save up to ${savings}% with verified discounts updated daily.`
        : `Latest ${storeName} coupon codes for ${monthYr}. Verified discounts, free shipping offers and exclusive deals — updated daily.`;

  return { title, h1, description };
}

/**
 * Short hero sub-heading displayed beneath H1.
 */
export function generateStoreHeroSubtitle({
  storeName,
  codeCount,
  maxSavings,
  locale,
  date = new Date(),
}) {
  const lang  = (locale || 'ar').split('-')[0];
  const isAr  = lang === 'ar';
  const today = isAr ? getCurrentMonthYearAr(date) : getCurrentMonthYearEn(date);

  if (isAr) {
    const parts = [];
    if (codeCount)   parts.push(`${codeCount} كود نشط`);
    if (maxSavings)  parts.push(`توفير يصل إلى ${Math.round(maxSavings)}٪`);
    parts.push(`محدّث ${today}`);
    return parts.join(' • ');
  }

  const parts = [];
  if (codeCount)  parts.push(`${codeCount} active codes`);
  if (maxSavings) parts.push(`Save up to ${Math.round(maxSavings)}%`);
  parts.push(`Updated ${today}`);
  return parts.join(' • ');
}
