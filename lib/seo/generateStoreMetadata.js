// lib/seo/generateStoreMetadata.js
import { generateStorePageTitle } from './dynamicStoreTitle'; // ✅ FIX: Removed .js extension

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Helper to safely extract localized country name
function getCountryName(country, isArabic) {
  if (country?.translations?.[0]?.name) return country.translations[0].name;
  if (country?.name) return country.name;
  return isArabic ? 'السعودية' : 'Saudi Arabia'; // Safe fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE METADATA
// ─────────────────────────────────────────────────────────────────────────────

export function generateEnhancedStoreMetadata({
  store,
  locale,
  voucherCount = 0,
  categories = [],
  country,
  arSlug,
  enSlug,
}) {
  // ✅ FIX: Removed the unused 'countryCode' variable that causes ESLint build failures
  const [language] = locale.split('-');
  const isArabic = language === 'ar';
  const currentSlug = store.slug;
  
  const resolvedArSlug = arSlug || currentSlug;
  const resolvedEnSlug = enSlug || currentSlug; 
  const resolvedCountryName = getCountryName(country, isArabic);

  const { title } = generateStorePageTitle({
    storeName: store.name,
    locale,
    codeCount: voucherCount,
  });

  const description = generateOptimizedDescription(store, voucherCount, isArabic, resolvedCountryName);
  const keywords = generateKeywords(store, categories, isArabic, resolvedCountryName);

  const ogImage = store.coverImage || store.logo || `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      absolute: title,
      template: isArabic ? `%s | كوبونات ${store.name}` : `%s | ${store.name} Coupons`,
    },
    description,
    keywords,
    authors: [{ name: isArabic ? 'كوبونات' : 'Cobonat' }],
    creator: isArabic ? 'كوبونات' : 'Cobonat',
    publisher: isArabic ? 'كوبونات' : 'Cobonat',
    formatDetection: { telephone: false, email: false, address: false },

    alternates: {
      canonical: `${BASE_URL}/${locale}/stores/${currentSlug}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
        'en-SA': `${BASE_URL}/en-SA/stores/${resolvedEnSlug}`,
        'x-default': `${BASE_URL}/ar-SA/stores/${resolvedArSlug}`,
      },
    },

    openGraph: {
      type: 'website',
      locale,
      url: `${BASE_URL}/${locale}/stores/${currentSlug}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${store.name} ${isArabic ? 'كوبونات' : 'Coupons'}`, type: 'image/png' }],
      countryName: resolvedCountryName,
    },

    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title,
      description,
      images: [ogImage],
    },

    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    other: {
      'article:published_time': store.createdAt,
      'article:modified_time': store.updatedAt || store.createdAt,
      'og:updated_time': store.updatedAt || store.createdAt,
    },
  };
}

function generateOptimizedDescription(store, voucherCount, isArabic, countryName) {
  const storeName = store.name;
  if (isArabic) {
    return `كوبونات ${storeName} المضمونة! ${voucherCount}+ كود خصم فعال ومجرب في ${countryName}. وفر على مشترياتك مع عروض حصرية وخصومات تصل لـ70%. ${store.description || ''}`.trim();
  }
  return `Get the best ${storeName} coupons! ${voucherCount}+ verified discount codes in ${countryName}. Save money with exclusive deals up to 70% off. ${store.description || ''}`.trim();
}

function generateKeywords(store, categories, isArabic, countryName) {
  const storeName = store.name;
  const categoryNames = categories.map(c => c.name);
  if (isArabic) {
    return [
      `كوبونات ${storeName}`, `كود خصم ${storeName}`, `عروض ${storeName}`, `خصومات ${storeName}`,
      `${storeName} ${countryName}`, `كوبون ${storeName}`, `برومو كود ${storeName}`,
      ...categoryNames.map(cat => `كوبونات ${cat}`),
      'كوبونات حصرية', 'عروض حصرية', 'خصم أول طلب', 'شحن مجاني', 'كوبونات مجربة',
    ];
  }
  return [
    `${storeName} coupons`, `${storeName} discount code`, `${storeName} promo code`,
    `${storeName} deals`, `${storeName} ${countryName}`, `${storeName} voucher`,
    ...categoryNames.map(cat => `${cat} coupons`),
    'exclusive deals', 'first order discount', 'free shipping', 'verified coupons',
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY METADATA
// ─────────────────────────────────────────────────────────────────────────────

export function generateEnhancedCategoryMetadata({
  category,
  locale,
  storeCount = 0,
  voucherCount = 0,
  country,
  arSlug,
  enSlug,
}) {
  const [language] = locale.split('-');
  const isArabic = language === 'ar';
  const categoryName = category.name;
  
  const resolvedArSlug = arSlug || category.slug;
  const resolvedEnSlug = enSlug || category.slug;
  const resolvedCountryName = getCountryName(country, isArabic);

  const title = isArabic
    ? `كوبونات ${categoryName} | ${storeCount}+ متجر في ${resolvedCountryName}`
    : `${categoryName} Coupons | ${storeCount}+ Stores in ${resolvedCountryName}`;

  const description = isArabic
    ? `تصفح ${voucherCount}+ كود خصم لفئة ${categoryName} من ${storeCount} متجر في ${resolvedCountryName}. عروض حصرية وخصومات تصل لـ70%. ${category.description || ''}`.trim()
    : `Browse ${voucherCount}+ discount codes for ${categoryName} from ${storeCount} stores in ${resolvedCountryName}. Exclusive deals up to 70% off. ${category.description || ''}`.trim();

  const ogImage = `${BASE_URL}/logo-512x512.png`;
  const canonicalPath = `/${locale}/categories/${category.slug}`;
  const arPath = `/ar-SA/categories/${resolvedArSlug}`;
  const enPath = `/en-SA/categories/${resolvedEnSlug}`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}${canonicalPath}`,
      languages: {
        'ar-SA': `${BASE_URL}${arPath}`,
        'en-SA': `${BASE_URL}${enPath}`,
        'x-default': `${BASE_URL}${arPath}`,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{ url: ogImage, width: 512, height: 512, alt: 'Cobonat Logo' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}
