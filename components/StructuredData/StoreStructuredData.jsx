// components/StructuredData/StoreStructuredData.jsx
/**
 * FINAL COMPLETE Structured Data for Store Pages
 * ✅ FIX: Uses dynamic brand name (كوبونات vs Cobonat)
 * ✅ FIX: Removed redundant Organization definition to prevent conflicts
 * ✅ FIX: All references now link correctly to the root #organization
 */

export default function StoreStructuredData({ 
  store,
  vouchers = [],
  otherPromos = [],
  storeProducts = [],
  curatedOffers = [],
  offerStacks = [],
  locale,
  country,
  breadcrumbs = [],
  aggregateRating = null 
}) {
  const [language] = locale.split('-');
  const isAr = language === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  // ✅ Dynamic Brand Name to ensure "كوبونات" shows in Arabic Search
  const brandName = isAr ? "كوبونات" : "Cobonat";

  const storeTranslation = store.translations?.find(t => t.locale === language) || store.translations?.[0];
  const storeName = storeTranslation?.name || store.name;
  const storeSlug = storeTranslation?.slug || store.slug;

  // ============================================================================
  // 1. VOUCHERS (OfferCatalog/ItemList)
  // ============================================================================
  const vouchersSchema = vouchers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": isAr ? `أكواد خصم ${storeName} الحصرية` : `Exclusive ${storeName} Promo Codes`,
    "numberOfItems": vouchers.length,
    "itemListElement": vouchers.slice(0, 20).map((v, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Offer",
        "@id": `${baseUrl}/${locale}/voucher/${v.id}`,
        "name": v.title,
        "description": v.description || undefined,
        "offeredBy": { 
          "@type": "Organization", 
          "@id": `${baseUrl}/#organization`, 
          "name": brandName 
        }
      }
    }))
  } : null;

  // ============================================================================
  // 2. STORE (Organization for the Merchant, e.g., Noon)
  // ============================================================================
  const storeOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/${locale}/stores/${storeSlug}/#store`,
    "name": storeName,
    "url": store.affiliateUrl || store.url,
    "logo": store.logo,
    "image": store.logo,
    "description": storeTranslation?.description || "",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SA"
    }
  };

  // ============================================================================
  // 3. WEBPAGE (The "Glue" that links everything)
  // ============================================================================
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/${locale}/stores/${storeSlug}`,
    "url": `${baseUrl}/${locale}/stores/${storeSlug}`,
    "name": storeTranslation?.seoTitle || `${storeName} Coupons`,
    "description": storeTranslation?.seoDescription || "",
    "isPartOf": { "@type": "WebSite", "@id": `${baseUrl}/#website` },
    "publisher": { 
      "@type": "Organization", 
      "@id": `${baseUrl}/#organization`, 
      "name": brandName 
    },
    "mainEntity": { "@id": `${baseUrl}/${locale}/stores/${storeSlug}/#store` }
  };

  // ============================================================================
  // 4. BREADCRUMBS
  // ============================================================================
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": isAr ? "الرئيسية" : "Home",
        "item": `${baseUrl}/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": storeName,
        "item": `${baseUrl}/${locale}/stores/${storeSlug}`
      }
    ]
  };

  // Combine schemas into an array
  const schemas = [
    breadcrumbSchema,
    webPageSchema,
    storeOrganizationSchema,
    vouchersSchema
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
