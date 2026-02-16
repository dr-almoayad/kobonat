// lib/seo/structuredData.js - JSON-LD Structured Data Generators

/**
 * Generate Organization schema for the site
 */
export function generateOrganizationSchema(locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cobonat",  // ✅ Always use brand name
    "alternateName": isArabic ? "كوبونات" : "Cobonat",  // Arabic alternative
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/cobonat-logo-512x512.png`,
      "width": 512,
      "height": 512
    },
    "description": isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    "sameAs": [
      "https://www.facebook.com/cobonatme",
      "https://t.me/cobonatme",
      "https://www.tiktok.com/@cobonatme",
      "https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": `${baseUrl}/${locale}/contact`,
      "availableLanguage": ["Arabic", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SA"
    }
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema(locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": isArabic ? "كوبونات" : "Coupons",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/${locale}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Generate Store schema with offers
 */
export function generateStoreSchema(store, vouchers, locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  const offers = vouchers.slice(0, 10).map(voucher => ({
    "@type": "Offer",
    "name": isArabic ? voucher.title_ar : voucher.title_en,
    "description": isArabic ? voucher.description_ar : voucher.description_en,
    "priceSpecification": voucher.discount ? {
      "@type": "UnitPriceSpecification",
      "price": voucher.discount
    } : undefined,
    "validFrom": voucher.startDate || voucher.createdAt,
    "validThrough": voucher.expiryDate,
    "url": `${baseUrl}/${locale}/stores/${store.slug}`,
    "availability": voucher.expiryDate && new Date(voucher.expiryDate) < new Date() 
      ? "https://schema.org/Discontinued" 
      : "https://schema.org/InStock"
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": store.name,
    "image": store.logo,
    "url": store.websiteUrl,
    "description": store.description || `${store.name} coupons and deals`,
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${store.name} Offers`,
      "itemListElement": offers
    }
  };
}

/**
 * Generate Offer schema for individual voucher
 */
export function generateOfferSchema(voucher, store, locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": isArabic ? voucher.title_ar : voucher.title_en,
    "description": isArabic ? voucher.description_ar : voucher.description_en,
    "seller": {
      "@type": "Organization",
      "name": store.name,
      "url": store.websiteUrl,
      "logo": store.logo
    },
    "priceSpecification": voucher.discount ? {
      "@type": "UnitPriceSpecification",
      "price": voucher.discount
    } : undefined,
    "validFrom": voucher.startDate || voucher.createdAt,
    "validThrough": voucher.expiryDate,
    "url": voucher.landingUrl || store.websiteUrl,
    "availability": voucher.expiryDate && new Date(voucher.expiryDate) < new Date() 
      ? "https://schema.org/Discontinued" 
      : "https://schema.org/InStock",
    "aggregateRating": voucher._count?.clicks > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": voucher._count.clicks.toString()
    } : undefined
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items, locale) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? `${baseUrl}${item.url}` : undefined
    }))
  };
}

/**
 * Generate ItemList schema for store listings
 */
export function generateStoreListSchema(stores, locale) {
  const isArabic = locale.startsWith('ar');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": isArabic ? "المتاجر المميزة" : "Featured Stores",
    "itemListElement": stores.map((store, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Store",
        "name": store.name,
        "image": store.logo,
        "url": `${baseUrl}/${locale}/stores/${store.slug}`
      }
    }))
  };
}

/**
 * React component to inject structured data
 */
export function StructuredData({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Multiple schemas wrapper
 */
export function MultipleSchemas({ schemas }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
    </>
  );
}
