// lib/seo/metadata.js - SEO Metadata Generator

/**
 * Generate metadata for store pages
 */
export function generateStoreMetadata(store, locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  const title = isArabic 
    ? `كوبونات ${store.name} - خصومات حصرية في ${country.name_ar}`
    : `${store.name} Coupons & Deals - Save More in ${country.name_en}`;
  
  const description = isArabic
    ? `احصل على أفضل كوبونات وعروض ${store.name} في ${country.name_ar}. كوبونات حصرية ومُحدثة يومياً لتوفير المال عند التسوق.`
    : `Get the best ${store.name} coupons and deals in ${country.name_en}. Exclusive promo codes updated daily to save you money on every purchase.`;

  return {
    title,
    description,
    keywords: isArabic 
      ? `كوبونات ${store.name}, عروض ${store.name}, خصومات ${store.name}, ${country.name_ar}`
      : `${store.name} coupons, ${store.name} promo codes, ${store.name} deals, ${country.name_en}`,
    
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/stores/${store.slug}`,
      siteName: isArabic ? 'كوبونات' : 'Coupons',
      images: [
        {
          url: store.logo || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: store.name,
        }
      ],
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [store.logo || `${baseUrl}/og-image.png`],
    },
    
    alternates: {
      canonical: `${baseUrl}/${locale}/stores/${store.slug}`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/stores/${store.slug}`,
        'en-SA': `${baseUrl}/en-SA/stores/${store.slug}`,
        'ar-AE': `${baseUrl}/ar-AE/stores/${store.slug}`,
        'en-AE': `${baseUrl}/en-AE/stores/${store.slug}`,
        'ar-EG': `${baseUrl}/ar-EG/stores/${store.slug}`,
        'en-EG': `${baseUrl}/en-EG/stores/${store.slug}`,
      }
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(category, locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  const categoryName = isArabic ? category.name_ar : category.name_en;
  const countryName = isArabic ? country.name_ar : country.name_en;
  
  const title = isArabic 
    ? `كوبونات ${categoryName} - أفضل العروض في ${countryName}`
    : `${categoryName} Coupons & Deals - Best Offers in ${countryName}`;
  
  const description = isArabic
    ? `اكتشف أفضل كوبونات ${categoryName} في ${countryName}. عروض وخصومات حصرية من أفضل المتاجر، محدثة يومياً.`
    : `Discover the best ${categoryName} coupons in ${countryName}. Exclusive deals and discounts from top stores, updated daily.`;

  return {
    title,
    description,
    keywords: isArabic 
      ? `كوبونات ${categoryName}, عروض ${categoryName}, ${countryName}`
      : `${categoryName} coupons, ${categoryName} deals, ${countryName}`,
    
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/categories/${category.slug}`,
      siteName: isArabic ? 'كوبونات' : 'Coupons',
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    
    alternates: {
      canonical: `${baseUrl}/${locale}/categories/${category.slug}`,
    },
    
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for homepage
 */
export function generateHomeMetadata(locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  const countryName = isArabic ? country.name_ar : country.name_en;
  
  const title = isArabic 
    ? `كوبونات وعروض حصرية - وفر المال في ${countryName}`
    : `Exclusive Coupons & Deals - Save Money in ${countryName}`;
  
  const description = isArabic
    ? `أكبر موقع للكوبونات والعروض في ${countryName}. آلاف الكوبونات الحصرية والعروض المحدثة يومياً من أفضل المتاجر العالمية والمحلية.`
    : `The largest coupon platform in ${countryName}. Thousands of exclusive coupons and daily deals from the best global and local stores.`;

  return {
    title,
    description,
    keywords: isArabic 
      ? `كوبونات, عروض, خصومات, ${countryName}, كوبونات حصرية`
      : `coupons, deals, discounts, ${countryName}, promo codes`,
    
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Coupons',
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    
    alternates: {
      canonical: `${baseUrl}/${locale}`,
    },
    
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for search results
 */
export function generateSearchMetadata(query, locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  const title = isArabic 
    ? `نتائج البحث: ${query} - كوبونات وعروض`
    : `Search Results: ${query} - Coupons & Deals`;
  
  const description = isArabic
    ? `نتائج البحث عن "${query}". اعثر على أفضل الكوبونات والعروض.`
    : `Search results for "${query}". Find the best coupons and deals.`;

  return {
    title,
    description,
    robots: {
      index: false, // Don't index search results
      follow: true,
    },
  };
}