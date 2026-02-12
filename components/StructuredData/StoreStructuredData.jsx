// components/StructuredData/StoreStructuredData.jsx
/**
 * Comprehensive Structured Data for Store Pages
 * Implements multiple schema types for maximum SEO impact
 */

export default function StoreStructuredData({ 
  store, 
  vouchers = [], 
  locale,
  country,
  breadcrumbs = [],
  aggregateRating = null 
}) {
  const [language, countryCode] = locale.split('-');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  // 1. Organization Schema (for brand recognition)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": store.name,
    "url": `${baseUrl}/${locale}/stores/${store.slug}`,
    "logo": store.logo,
    "description": store.description,
    "sameAs": [
      store.website,
      store.socialMedia?.facebook,
      store.socialMedia?.twitter,
      store.socialMedia?.instagram
    ].filter(Boolean)
  };

  // 2. BreadcrumbList Schema (critical for navigation)
  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  } : null;

  // 3. ItemList Schema for vouchers/offers
  const offerListSchema = vouchers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": vouchers.slice(0, 10).map((voucher, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Offer",
        "@id": `${baseUrl}/${locale}/voucher/${voucher.id}`,
        "name": voucher.title,
        "description": voucher.description,
        "price": voucher.discountValue || "0",
        "priceCurrency": country.currency || "SAR",
        "availability": voucher.expiryDate 
          ? (new Date(voucher.expiryDate) > new Date() ? "https://schema.org/InStock" : "https://schema.org/OutOfStock")
          : "https://schema.org/InStock",
        "validFrom": voucher.createdAt,
        "validThrough": voucher.expiryDate,
        "seller": {
          "@type": "Organization",
          "name": store.name
        },
        "url": `${baseUrl}/${locale}/stores/${store.slug}#voucher-${voucher.id}`,
        ...(voucher.code && { "serialNumber": voucher.code })
      }
    }))
  } : null;

  // 4. WebPage Schema with detailed metadata
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/${locale}/stores/${store.slug}`,
    "url": `${baseUrl}/${locale}/stores/${store.slug}`,
    "name": `${store.name} ${language === 'ar' ? 'كوبونات وعروض' : 'Coupons & Deals'}`,
    "description": store.description,
    "inLanguage": language,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`
    },
    "about": {
      "@id": `${baseUrl}/${locale}/stores/${store.slug}/#organization`
    },
    "breadcrumb": {
      "@id": `${baseUrl}/${locale}/stores/${store.slug}/#breadcrumb`
    },
    "datePublished": store.createdAt,
    "dateModified": store.updatedAt || store.createdAt
  };

  // 5. AggregateRating Schema (if ratings available)
  const ratingSchema = aggregateRating ? {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": aggregateRating.ratingValue,
    "reviewCount": aggregateRating.reviewCount,
    "bestRating": "5",
    "worstRating": "1"
  } : null;

  // 6. LocalBusiness Schema (if store has physical presence)
  const localBusinessSchema = store.hasPhysicalStore ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": store.name,
    "image": store.logo,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": countryCode
    },
    "url": store.website,
    "priceRange": "$$"
  } : null;

  // Combine all schemas
  const schemas = [
    organizationSchema,
    breadcrumbSchema,
    offerListSchema,
    webPageSchema,
    ratingSchema,
    localBusinessSchema
  ].filter(Boolean);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      ))}
    </>
  );
}
