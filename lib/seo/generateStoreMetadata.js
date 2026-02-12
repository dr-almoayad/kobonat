// lib/seo/generateStoreMetadata.js
/**
 * Enhanced metadata generation for store pages
 * Optimized for search engines and social sharing
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export function generateEnhancedStoreMetadata({ 
  store, 
  locale, 
  voucherCount = 0,
  categories = [],
  country 
}) {
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';
  
  // Generate rich, keyword-optimized titles
  const title = generateOptimizedTitle(store, voucherCount, isArabic, countryCode);
  const description = generateOptimizedDescription(store, voucherCount, isArabic, countryCode);
  
  // Generate comprehensive keywords
  const keywords = generateKeywords(store, categories, isArabic, countryCode);
  
  // Create OG image URL (can be dynamic based on store)
  const ogImage = store.logo 
    ? `${BASE_URL}/api/og?store=${encodeURIComponent(store.name)}&logo=${encodeURIComponent(store.logo)}`
    : `${BASE_URL}/og-store-default.png`;

  return {
    metadataBase: new URL(BASE_URL),
    
    title: {
      absolute: title,
      template: isArabic ? `%s | كوبونات ${store.name}` : `%s | ${store.name} Coupons`
    },
    
    description,
    
    keywords,
    
    authors: [{ name: isArabic ? 'كوبونات' : 'Cobonat' }],
    
    creator: isArabic ? 'كوبونات' : 'Cobonat',
    
    publisher: isArabic ? 'كوبونات' : 'Cobonat',
    
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores/${store.slug}`,
      languages: generateHreflangAlternates(store.slug),
    },
    
    openGraph: {
      type: 'website',
      locale: locale,
      url: `${BASE_URL}/${locale}/stores/${store.slug}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title: title,
      description: description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${store.name} ${isArabic ? 'كوبونات' : 'Coupons'}`,
          type: 'image/png',
        }
      ],
      countryName: country?.name,
    },
    
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title: title,
      description: description,
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
    
    // Additional metadata for better indexing
    other: {
      'article:published_time': store.createdAt,
      'article:modified_time': store.updatedAt || store.createdAt,
      'og:updated_time': store.updatedAt || store.createdAt,
    },
  };
}

function generateOptimizedTitle(store, voucherCount, isArabic, countryCode) {
  const storeName = store.name;
  const year = new Date().getFullYear();
  
  if (isArabic) {
    return `كوبونات ${storeName} ${year} | ${voucherCount}+ كود خصم فعال ${countryCode}`;
  } else {
    return `${storeName} Coupons ${year} | ${voucherCount}+ Active Discount Codes ${countryCode}`;
  }
}

function generateOptimizedDescription(store, voucherCount, isArabic, countryCode) {
  const storeName = store.name;
  const month = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  
  if (isArabic) {
    return `احصل على أفضل كوبونات ${storeName} محدثة ${month}! ${voucherCount}+ كود خصم فعال ومجرب في ${countryCode}. وفر المال على مشترياتك مع عروض حصرية وخصومات تصل لـ70%. ${store.description || ''}`;
  } else {
    return `Get the best ${storeName} coupons updated ${month}! ${voucherCount}+ verified discount codes in ${countryCode}. Save money with exclusive deals up to 70% off. ${store.description || ''}`;
  }
}

function generateKeywords(store, categories, isArabic, countryCode) {
  const storeName = store.name;
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
      'كوبونات مجربة'
    ];
  } else {
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
      'verified coupons'
    ];
  }
}

function generateHreflangAlternates(slug) {
  const locales = ['ar-SA', 'en-SA', 'ar-AE', 'en-AE', 'ar-EG', 'en-EG', 'ar-QA', 'en-QA', 'ar-KW', 'en-KW', 'ar-OM', 'en-OM'];
  
  const alternates = {};
  locales.forEach(locale => {
    alternates[locale] = `${BASE_URL}/${locale}/stores/${slug}`;
  });
  alternates['x-default'] = `${BASE_URL}/ar-SA/stores/${slug}`;
  
  return alternates;
}

// Export helper for category pages too
export function generateEnhancedCategoryMetadata({ 
  category, 
  locale, 
  storeCount = 0,
  voucherCount = 0,
  country 
}) {
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';
  const categoryName = category.name;
  const year = new Date().getFullYear();
  
  const title = isArabic
    ? `كوبونات ${categoryName} ${year} | ${storeCount}+ متجر في ${countryCode}`
    : `${categoryName} Coupons ${year} | ${storeCount}+ Stores in ${countryCode}`;
    
  const description = isArabic
    ? `تصفح ${voucherCount}+ كود خصم لفئة ${categoryName} من ${storeCount} متجر في ${countryCode}. عروض حصرية وخصومات تصل لـ70%. ${category.description || ''}`
    : `Browse ${voucherCount}+ discount codes for ${categoryName} from ${storeCount} stores in ${countryCode}. Exclusive deals up to 70% off. ${category.description || ''}`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores/${category.slug}`,
      languages: generateHreflangAlternates(category.slug),
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: `${BASE_URL}/${locale}/stores/${category.slug}`,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
