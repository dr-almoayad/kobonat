// lib/seo/dynamicStoreTitle.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates authoritative, SEO-optimised titles and H1s for Saudi store pages.
// All Arabic copy uses a formal, expert-authority register — never casual.
// Month/year update automatically with no stale strings.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arabic month names in the formal MSA register used by Saudi press.
 * Using the Gregorian names widely adopted in Gulf e-commerce contexts
 * (يناير / فبراير / …) rather than Hijri names, which would require
 * a separate conversion library and change constantly.
 */
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the current month and year as an Arabic string.
 * Example: "إبريل 2026"
 */
export function getCurrentMonthYearAr(date = new Date()) {
  const month = ARABIC_MONTHS[date.getMonth()];
  const year  = date.getFullYear();
  // Arabic-Indic numerals are preferred in formal Saudi contexts for years
  // but Western numerals are standard in e-commerce titles — keep Western.
  return `${month} ${year}`;
}

/**
 * Returns the current month and year as an English string.
 * Example: "April 2026"
 */
export function getCurrentMonthYearEn(date = new Date()) {
  return `${ENGLISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// ── Title generators ──────────────────────────────────────────────────────────

/**
 * Primary page <title> and meta description for a store's coupon page.
 *
 * Arabic format:
 *   كود خصم [Store] [Month Year] - كوبونات فعالة ومجربة | كوبونات
 *
 * English format:
 *   [Store] Coupon Codes [Month Year] - Verified Deals | Cobonat
 *
 * @param {object}  opts
 * @param {string}  opts.storeName    - Localised store name
 * @param {string}  opts.locale       - Full locale string e.g. "ar-SA"
 * @param {number}  [opts.codeCount]  - Number of active codes (optional, enhances CTR)
 * @param {Date}    [opts.date]       - Override date (defaults to now)
 * @returns {{ title: string, description: string, h1: string }}
 */
export function generateStorePageTitle({ storeName, locale, codeCount, date = new Date() }) {
  const lang    = (locale || 'ar').split('-')[0];
  const isAr    = lang === 'ar';
  const monthYr = isAr ? getCurrentMonthYearAr(date) : getCurrentMonthYearEn(date);
  const count   = codeCount && codeCount > 0 ? codeCount : null;

  if (isAr) {
    const title = count
      ? `كود خصم ${storeName} ${monthYr} ← ${count}+ كوبون فعّال ومجرّب | كوبونات`
      : `كود خصم ${storeName} ${monthYr} - كوبونات فعالة ومجربة | كوبونات`;

    const h1 = `كوبونات وعروض ${storeName} - ${monthYr}`;

    const description = count
      ? `احصل على ${count}+ كود خصم فعّال لـ${storeName} محدّث ${monthYr}. عروض حصرية وخصومات موثّقة تصل إلى 70٪ — جرّبها مجاناً الآن.`
      : `أحدث كوبونات ${storeName} لشهر ${monthYr}. خصومات مجرّبة وموثّقة — سواء طلبت من الرياض، جدة أو أي مدينة في المملكة.`;

    return { title, h1, description };
  }

  // English
  const title = count
    ? `${storeName} Coupon Codes ${monthYr} — ${count}+ Active Deals | Cobonat`
    : `${storeName} Coupon Codes ${monthYr} — Verified Deals | Cobonat`;

  const h1 = `${storeName} Coupons & Deals — ${monthYr}`;

  const description = count
    ? `Find ${count}+ verified ${storeName} coupon codes updated for ${monthYr}. Exclusive deals up to 70% off — tested and confirmed.`
    : `Latest ${storeName} coupon codes for ${monthYr}. Verified discounts, free shipping offers and exclusive deals — updated daily.`;

  return { title, h1, description };
}

/**
 * Generates a canonical breadcrumb label for a store page.
 * Used in structured data and UI breadcrumbs.
 */
export function generateStoreBreadcrumbLabel(storeName, locale) {
  const lang = (locale || 'ar').split('-')[0];
  return lang === 'ar'
    ? `كوبونات ${storeName}`
    : `${storeName} Coupons`;
}

/**
 * Generates a short, punchy hero sub-heading (displayed beneath H1).
 * Useful for above-the-fold credibility signals.
 */
export function generateStoreHeroSubtitle({ storeName, codeCount, maxSavings, locale, date = new Date() }) {
  const lang  = (locale || 'ar').split('-')[0];
  const isAr  = lang === 'ar';
  const today = isAr ? getCurrentMonthYearAr(date) : getCurrentMonthYearEn(date);

  if (isAr) {
    const parts = [];
    if (codeCount) parts.push(`${codeCount} كود نشط`);
    if (maxSavings) parts.push(`توفير يصل إلى ${maxSavings}٪`);
    parts.push(`محدّث ${today}`);
    return parts.join(' • ');
  }

  const parts = [];
  if (codeCount) parts.push(`${codeCount} active codes`);
  if (maxSavings) parts.push(`Save up to ${maxSavings}%`);
  parts.push(`Updated ${today}`);
  return parts.join(' • ');
}
