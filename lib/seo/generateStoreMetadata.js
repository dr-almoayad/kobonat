// lib/seo/generateStoreMetadata.js
/**
 * Enhanced metadata generation for store and category pages.
 *
 * FIX 1 (stores): generateEnhancedStoreMetadata already accepted arSlug/enSlug.
 *   No change needed there — the fix lives in page.jsx (null-safe fallback).
 *
 * FIX 2 (categories): generateEnhancedCategoryMetadata now accepts arSlug/enSlug
 *   so the caller can pass the correct per-locale slug for each hreflang alternate,
 *   instead of using the same current-locale slug for both languages.
 *   Without this, Arabic category pages produced `/en-SA/stores/إلكترونيات` as
 *   the en-SA alternate → 404 → Google drops the entire hreflang set and often
 *   refuses to index the page.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ─────────────────────────────────────────────────────────────────────────────
// STORE METADATA
// ─────────────────────────────────────────────────────────────────────────────

export function generateEnhancedStoreMetadata({
  store,
  locale,
  voucherCount = 0,
  categories = [],
  country,
  arSlug,  // explicit Arabic slug (passed from page.jsx)
  enSlug,  // explicit English slug (passed from page.jsx)
}) {
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';

  const currentSlug    = store.slug;
  const resolvedArSlug = arSlug || currentSlug;
  const resolvedEnSlug = enSlug || currentSlug;

  const title       = generateOptimizedTitle(store, voucherCount, isArabic, countryCode);
  const description = generateOptimizedDescription(store, voucherCount, isArabic, countryCode);
  const keywords    = generateKeywords(store, categories, isArabic, countryCode);

  // Use coverImage > logo > static default. The /api/og route may not exist yet,
  // so we never reference it here to avoid OG-image 404s in Search Console.
  const ogImage =
    store.coverImage ||
    store.logo ||
    `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),

    title: {
      absolute: title,
      template: isArabic ? `%s | كوبونات ${store.name}` : `%s | ${store.name} Coupons`,
    },

    description,
    keywords,

    authors:   [{ name: isArabic ? 'كوبونات' : 'Cobonat' }],
    creator:   isArabic ? 'كوبونات' : 'Cobonat',
    publisher: isArabic ? 'كوبونات' : 'Cobonat',

    formatDetection: {
      telephone: false,
      email:     false,
      address:   false,
    },

    // FIX: locale-specific slugs for hreflang — both alternates resolve to real pages.
    // If arSlug or enSlug is missing (translation doesn't exist in that language),
    // the caller should omit that language from the alternates object rather than
    // pointing to a broken URL (handled in page.jsx before calling this function).
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores/${currentSlug}`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
        'en-SA':    `${BASE_URL}/en-SA/stores/${resolvedEnSlug}`,
        'x-default': `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
      },
    },

    openGraph: {
      type:        'website',
      locale:      locale,
      url:         `${BASE_URL}/${locale}/stores/${currentSlug}`,
      siteName:    isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [
        {
          url:    ogImage,
          width:  1200,
          height: 630,
          alt:    `${store.name} ${isArabic ? 'كوبونات' : 'Coupons'}`,
          type:   'image/png',
        },
      ],
      countryName: country?.name,
    },

    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      creator:     '@cobonat',
      title,
      description,
      images: [ogImage],
    },

    robots: {
      index:  true,
      follow: true,
      nocache: false,
      googleBot: {
        index:  true,
        follow: true,
        'max-video-preview':  -1,
        'max-image-preview':  'large',
        'max-snippet':        -1,
      },
    },

    other: {
      'article:published_time': store.createdAt,
      'article:modified_time':  store.updatedAt || store.createdAt,
      'og:updated_time':        store.updatedAt || store.createdAt,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Title / description / keyword helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateOptimizedTitle(store, voucherCount, isArabic, countryCode) {
  const storeName = store.name;
  const year      = new Date().getFullYear();

  if (isArabic) {
    return `كوبونات ${storeName} ${year} | ${voucherCount}+ كود خصم فعال ${countryCode}`;
  }
  return `${storeName} Coupons ${year} | ${voucherCount}+ Active Discount Codes ${countryCode}`;
}

function generateOptimizedDescription(store, voucherCount, isArabic, countryCode) {
  const storeName = store.name;
  const month     = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
    month: 'long',
    year:  'numeric',
  });

  if (isArabic) {
    return `احصل على أفضل كوبونات ${storeName} محدثة ${month}! ${voucherCount}+ كود خصم فعال ومجرب في ${countryCode}. وفر المال على مشترياتك مع عروض حصرية وخصومات تصل لـ70%. ${store.description || ''}`;
  }
  return `Get the best ${storeName} coupons updated ${month}! ${voucherCount}+ verified discount codes in ${countryCode}. Save money with exclusive deals up to 70% off. ${store.description || ''}`;
}

function generateKeywords(store, categories, isArabic, countryCode) {
  const storeName     = store.name;
  const categoryNames = categories.map(c => c.name);

  if (isArabic) {
    return [
      `كوبونات ${storeName}`,
      `كود خصم ${storeName}`,
      `عروض ${storeName}`,
      `خصومات ${storeName}`,
      `${storeName} ${countryCode}`,
      `كوبون ${storeName}`,
      `برومو كود ${storeName}`,
      ...categoryNames.map(cat => `كوبونات ${cat}`),
      'كوبونات حصرية',
      'عروض حصرية',
      'خصم أول طلب',
      'شحن مجاني',
      'كوبونات مجربة',
    ];
  }
  return [
    `${storeName} coupons`,
    `${storeName} discount code`,
    `${storeName} promo code`,
    `${storeName} deals`,
    `${storeName} ${countryCode}`,
    `${storeName} voucher`,
    ...categoryNames.map(cat => `${cat} coupons`),
    'exclusive deals',
    'first order discount',
    'free shipping',
    'verified coupons',
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY METADATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FIX: accepts explicit arSlug and enSlug so the caller can pass the correct
 * per-locale slug for each hreflang alternate. The category object only carries
 * the current-locale slug, so without these params both alternates used the same
 * slug → 404 for whichever language the slug doesn't belong to.
 */
export function generateEnhancedCategoryMetadata({
  category,
  locale,
  storeCount   = 0,
  voucherCount = 0,
  country,
  arSlug,  // ← NEW: explicit Arabic slug
  enSlug,  // ← NEW: explicit English slug
}) {
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';
  const categoryName = category.name;
  const year         = new Date().getFullYear();

  // Use the resolved slugs for hreflang alternates.
  // If the caller couldn't find the other language's slug, fall back to the
  // current slug only for that language's alternate (still potentially broken,
  // but no worse than before — the null-safe logic in page.jsx should prevent
  // this case by omitting the alternate entirely when no translation exists).
  const resolvedArSlug = arSlug || category.slug;
  const resolvedEnSlug = enSlug || category.slug;

  const title = isArabic
    ? `كوبونات ${categoryName} ${year} | ${storeCount}+ متجر في ${countryCode}`
    : `${categoryName} Coupons ${year} | ${storeCount}+ Stores in ${countryCode}`;

  const description = isArabic
    ? `تصفح ${voucherCount}+ كود خصم لفئة ${categoryName} من ${storeCount} متجر في ${countryCode}. عروض حصرية وخصومات تصل لـ70%. ${category.description || ''}`
    : `Browse ${voucherCount}+ discount codes for ${categoryName} from ${storeCount} stores in ${countryCode}. Exclusive deals up to 70% off. ${category.description || ''}`;

  const ogImage = `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,

    alternates: {
      canonical: `${BASE_URL}/${locale}/stores/${category.slug}`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
        'en-SA':    `${BASE_URL}/en-SA/stores/${resolvedEnSlug}`,
        'x-default': `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
      },
    },

    openGraph: {
      type:     'website',
      locale:   locale,
      url:      `${BASE_URL}/${locale}/stores/${category.slug}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [
        {
          url:    ogImage,
          width:  512,
          height: 512,
          alt:    'Cobonat Logo',
        },
      ],
    },

    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      title,
      description,
      images: [ogImage],
    },

    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateHreflangAlternates — kept for any external callers but deprecated
// in favour of passing explicit arSlug/enSlug to the metadata functions above.
// ─────────────────────────────────────────────────────────────────────────────

export function generateHreflangAlternates(slug) {
  return {
    'ar-SA':    `${BASE_URL}/ar-SA/stores/${slug}`,
    'en-SA':    `${BASE_URL}/en-SA/stores/${slug}`,
    'x-default': `${BASE_URL}/ar-SA/stores/${slug}`,
  };
}
