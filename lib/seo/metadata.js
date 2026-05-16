// lib/seo/metadata.js - Saudi Arabia only (ar-SA)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export function generateCategoryMetadata(category, locale, country) {
  const isArabic = locale.startsWith('ar');
  const categoryName = isArabic ? category.name_ar : category.name_en;
  const countryName = isArabic ? country.name_ar : country.name_en;
  const title = isArabic 
    ? `كوبونات ${categoryName} - أفضل العروض في ${countryName}`
    : `${categoryName} Coupons & Deals - Best Offers in ${countryName}`;
  const description = isArabic
    ? `اكتشف أفضل كوبونات ${categoryName} في ${countryName}. عروض وخصومات حصرية من أفضل المتاجر، محدثة يومياً.`
    : `Discover the best ${categoryName} coupons in ${countryName}. Exclusive deals and discounts from top stores, updated daily.`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: isArabic ? `كوبونات ${categoryName}, عروض ${categoryName}, ${countryName}` : `${categoryName} coupons, ${categoryName} deals, ${countryName}`,
    openGraph: {
      siteName: 'Cobonat',
      title,
      description,
      url: `${BASE_URL}/${locale}/categories/${category.slug}`,
      images: [{ url: category.image || `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: categoryName }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title,
      description,
      images: [category.image || `${BASE_URL}/logo-512x512.png`],
    },
    // ✅ Only ar-SA and x-default
    alternates: {
      canonical: `${BASE_URL}/${locale}/categories/${category.slug}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/categories/${category.slug}`,
        'x-default': `${BASE_URL}/ar-SA/categories/${category.slug}`,
      },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export function generateHomeMetadata(locale, country) {
  const isArabic = locale.startsWith('ar');
  const countryName = isArabic ? country.name_ar : country.name_en;
  const title = isArabic 
    ? `Cobonat | كوبونات - أكواد خصم ${countryName} (محدث باستمرار)`
    : `Cobonat | Exclusive Coupons & Deals - Save Money in ${countryName}`;
  const description = isArabic
    ? `منصتك الأولى لأكواد الخصم والعروض في ${countryName}. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية.`
    : `Your #1 source for verified discount codes in ${countryName}. Save more with verified and active coupons for top local and global stores.`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: isArabic ? `كوبونات, عروض, خصومات, ${countryName}, كوبونات حصرية, Cobonat` : `coupons, deals, discounts, ${countryName}, promo codes, Cobonat`,
    openGraph: {
      siteName: 'Cobonat',
      title: isArabic ? 'Cobonat | كوبونات' : 'Cobonat - Coupons',
      description,
      url: `${BASE_URL}/${locale}`,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title: isArabic ? 'Cobonat | كوبونات' : 'Cobonat - Coupons',
      description,
      images: [`${BASE_URL}/logo-512x512.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export function generateSearchMetadata(query, locale) {
  const isArabic = locale.startsWith('ar');
  const title = isArabic ? `نتائج البحث: ${query} - Cobonat` : `Search Results: ${query} - Cobonat`;
  const description = isArabic
    ? `نتائج البحث عن "${query}". اعثر على أفضل الكوبونات والعروض على Cobonat.`
    : `Search results for "${query}". Find the best coupons and deals on Cobonat.`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    openGraph: {
      siteName: 'Cobonat',
      title,
      description,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
    },
    robots: { index: false, follow: true, noarchive: true, nocache: true },
  };
}

export function generateStoresListMetadata(locale, country) {
  const isArabic = locale.startsWith('ar');
  const countryName = isArabic ? country.name_ar : country.name_en;
  const title = isArabic 
    ? `جميع المتاجر - كوبونات وعروض ${countryName} | Cobonat`
    : `All Stores - Coupons & Deals ${countryName} | Cobonat`;
  const description = isArabic
    ? `تصفح جميع المتاجر المتاحة في ${countryName}. احصل على أفضل الكوبونات والعروض من متاجرك المفضلة على Cobonat.`
    : `Browse all available stores in ${countryName}. Get the best coupons and deals from your favorite stores on Cobonat.`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    openGraph: {
      siteName: 'Cobonat',
      title,
      description,
      url: `${BASE_URL}/${locale}/stores`,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonatme',
      title,
      description,
      images: [`${BASE_URL}/logo-512x512.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/stores`,
        'x-default': `${BASE_URL}/ar-SA/stores`,
      },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}
