// lib/seo/metadata.js - CORRECTED SEO Metadata Generator

/**
 * Generate metadata for store pages
 */


/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(category, locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  const categoryName = isArabic ? category.name_ar : category.name_en;
  const countryName = isArabic ? country.name_ar : country.name_en;
  
  const title = isArabic 
    ? `كوبونات ${categoryName} - أفضل العروض في ${countryName}`
    : `${categoryName} Coupons & Deals - Best Offers in ${countryName}`;
  
  const description = isArabic
    ? `اكتشف أفضل كوبونات ${categoryName} في ${countryName}. عروض وخصومات حصرية من أفضل المتاجر، محدثة يومياً.`
    : `Discover the best ${categoryName} coupons in ${countryName}. Exclusive deals and discounts from top stores, updated daily.`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: isArabic 
      ? `كوبونات ${categoryName}, عروض ${categoryName}, ${countryName}`
      : `${categoryName} coupons, ${categoryName} deals, ${countryName}`,
    
    openGraph: {
      // ✅ CRITICAL FIX: Changed to "Cobonat"
      siteName: 'Cobonat',
      
      title,
      description,
      url: `${baseUrl}/${locale}/categories/${category.slug}`,
      
      // ✅ IMPROVED: Use category image if available
      images: [
        {
          url: category.image || `${baseUrl}/logo-512x512.png`,
          width: 512,
          height: 512,
          alt: categoryName,
        }
      ],
      
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title,
      description,
      images: [category.image || `${baseUrl}/logo-512x512.png`],
    },
    
    // ✅ ENHANCED: Added all 12 locales
    alternates: {
      canonical: `${baseUrl}/${locale}/categories/${category.slug}`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/categories/${category.slug}`,
        'en-SA': `${baseUrl}/en-SA/categories/${category.slug}`,
        'x-default': `${baseUrl}/ar-SA/categories/${category.slug}`,
      },
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
 * Generate metadata for homepage
 */
export function generateHomeMetadata(locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const countryName = isArabic ? country.name_ar : country.name_en;
  
  const title = isArabic 
    ? `Cobonat | كوبونات - أكواد خصم ${countryName} (محدث باستمرار)`
    : `Cobonat | Exclusive Coupons & Deals - Save Money in ${countryName}`;
  
  const description = isArabic
    ? `منصتك الأولى لأكواد الخصم والعروض في ${countryName}. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية.`
    : `Your #1 source for verified discount codes in ${countryName}. Save more with verified and active coupons for top local and global stores.`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: isArabic 
      ? `كوبونات, عروض, خصومات, ${countryName}, كوبونات حصرية, Cobonat`
      : `coupons, deals, discounts, ${countryName}, promo codes, Cobonat`,
    
    openGraph: {
      // ✅ CRITICAL FIX: Changed to "Cobonat"
      siteName: 'Cobonat',
      
      title: isArabic ? 'Cobonat | كوبونات' : 'Cobonat - Coupons',
      description,
      url: `${baseUrl}/${locale}`,
      
      // ✅ CRITICAL: Added Cobonat logo
      images: [
        {
          url: `${baseUrl}/logo-512x512.png`,
          width: 512,
          height: 512,
          alt: 'Cobonat Logo',
        }
      ],
      
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title: isArabic ? 'Cobonat | كوبونات' : 'Cobonat - Coupons',
      description,
      images: [`${baseUrl}/logo-512x512.png`],
    },
    
    // ✅ ENHANCED: Added all 12 locales
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA`,
        'en-SA': `${baseUrl}/en-SA`,
        'x-default': `${baseUrl}/ar-SA`,
      },
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
 * Generate metadata for search results
 */
export function generateSearchMetadata(query, locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  const title = isArabic 
    ? `نتائج البحث: ${query} - Cobonat`
    : `Search Results: ${query} - Cobonat`;
  
  const description = isArabic
    ? `نتائج البحث عن "${query}". اعثر على أفضل الكوبونات والعروض على Cobonat.`
    : `Search results for "${query}". Find the best coupons and deals on Cobonat.`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    
    openGraph: {
      // ✅ ADDED: siteName even for search pages
      siteName: 'Cobonat',
      
      title,
      description,
      
      // ✅ ADDED: Logo for search pages
      images: [
        {
          url: `${baseUrl}/logo-512x512.png`,
          width: 512,
          height: 512,
          alt: 'Cobonat Logo',
        }
      ],
    },
    
    robots: {
      index: false, // Don't index search results
      follow: true,
      noarchive: true,
      nocache: true,
    },
  };
}

/**
 * Generate metadata for stores listing page
 */
export function generateStoresListMetadata(locale, country) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const countryName = isArabic ? country.name_ar : country.name_en;
  
  const title = isArabic 
    ? `جميع المتاجر - كوبونات وعروض ${countryName} | Cobonat`
    : `All Stores - Coupons & Deals ${countryName} | Cobonat`;
  
  const description = isArabic
    ? `تصفح جميع المتاجر المتاحة في ${countryName}. احصل على أفضل الكوبونات والعروض من متاجرك المفضلة على Cobonat.`
    : `Browse all available stores in ${countryName}. Get the best coupons and deals from your favorite stores on Cobonat.`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    
    openGraph: {
      siteName: 'Cobonat',
      title,
      description,
      url: `${baseUrl}/${locale}/stores`,
      images: [
        {
          url: `${baseUrl}/logo-512x512.png`,
          width: 512,
          height: 512,
          alt: 'Cobonat Logo',
        }
      ],
      locale: locale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title,
      description,
      images: [`${baseUrl}/logo-512x512.png`],
    },
    
    alternates: {
      canonical: `${baseUrl}/${locale}/stores`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/stores`,
        'en-SA': `${baseUrl}/en-SA/stores`,
        'x-default': `${baseUrl}/ar-SA/stores`,
      },
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
