// components/StructuredData/StoreStructuredData.jsx
/**
 * FINAL COMPLETE Structured Data for Store Pages
 * ✅ Includes: Platform, Store, Vouchers, OtherPromos, StoreProducts
 * ✅ Uses: seoTitle & seoDescription from StoreTranslation
 * ✅ Aligned: With WebSiteStructuredData and Prisma schema
 */

export default function StoreStructuredData({ 
  store,              // Store with translations
  vouchers = [],      // Regular coupons/deals
  otherPromos = [],   // Bank/payment/seasonal offers
  storeProducts = [], // ✅ Featured products
  locale,
  country,
  breadcrumbs = [],
  aggregateRating = null 
}) {
  const [language, countryCode] = locale.split('-');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  
  // Get store translation for current locale
  const storeTranslation = store.translations?.find(t => t.locale === language) || store.translations?.[0];
  
  // ✅ Use SEO fields from StoreTranslation if available
  const storeName = storeTranslation?.name || store.name;
  const storeDescription = storeTranslation?.description || '';
  const seoTitle = storeTranslation?.seoTitle;
  const seoDescription = storeTranslation?.seoDescription;

  // ============================================================================
  // 1. COBONAT PLATFORM Organization Schema
  // Must match WebSiteStructuredData @id: baseUrl/#organization
  // ============================================================================
  const platformOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,  // ✅ Matches WebSiteStructuredData
    "name": "Cobonat",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-512x512.png`,
      "width": 512,
      "height": 512
    },
    "description": language === 'ar'
      ? "منصة كوبونات الرائدة في السعودية والشرق الأوسط"
      : "Leading coupon platform in Saudi Arabia and the Middle East",
    "sameAs": [
      "https://www.facebook.com/cobonatme",
      "https://t.me/cobonatme",
      "https://www.tiktok.com/@cobonatme",
      "https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i"
    ]
  };

  // ============================================================================
  // 2. STORE Organization Schema
  // Represents the merchant (Amazon, Noon, etc.)
  // ============================================================================
  const storeOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug || store.slug}/#merchant`,
    "name": storeName,
    "url": store.websiteUrl || store.website,
    "logo": store.logo,
    "description": storeDescription,
    "sameAs": [
      store.websiteUrl || store.website,
      store.socialMedia?.facebook,
      store.socialMedia?.twitter,
      store.socialMedia?.instagram
    ].filter(Boolean)
  };

  // ============================================================================
  // 3. BreadcrumbList Schema
  // ============================================================================
  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#breadcrumb`,
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  } : null;

  // ============================================================================
  // 4. VOUCHERS - ItemList for Coupons/Deals
  // ============================================================================
  const voucherListSchema = vouchers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#vouchers`,
    "name": language === 'ar' 
      ? `كوبونات ${storeName}` 
      : `${storeName} Coupons`,
    "description": language === 'ar'
      ? `أكواد خصم وكوبونات فعالة من ${storeName}`
      : `Active discount codes and coupons from ${storeName}`,
    "itemListElement": vouchers.slice(0, 20).map((voucher, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Offer",
        "@id": `${baseUrl}/${locale}/voucher/${voucher.id}`,
        "name": voucher.title,
        "description": voucher.description,
        "price": voucher.discountValue || voucher.discount || "0",
        "priceCurrency": country?.currency || "SAR",
        "availability": voucher.expiryDate 
          ? (new Date(voucher.expiryDate) > new Date() 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock")
          : "https://schema.org/InStock",
        "validFrom": voucher.startDate || voucher.createdAt,
        "validThrough": voucher.expiryDate,
        "seller": {
          "@type": "Organization",
          "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#merchant`,
          "name": storeName
        },
        "offeredBy": {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          "name": "Cobonat"
        },
        "url": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}#voucher-${voucher.id}`,
        ...(voucher.code && { "serialNumber": voucher.code }),
        ...(voucher.image && { "image": voucher.image })
      }
    }))
  } : null;

  // ============================================================================
  // 5. OTHER PROMOS - ItemList for Bank/Payment Offers
  // ============================================================================
  const otherPromosSchema = otherPromos.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#promotions`,
    "name": language === 'ar' 
      ? `عروض خاصة من ${storeName}` 
      : `Special Promotions from ${storeName}`,
    "description": language === 'ar'
      ? `عروض البنوك والدفع والعروض الموسمية من ${storeName}`
      : `Bank offers, payment deals, and seasonal promotions from ${storeName}`,
    "itemListElement": otherPromos.slice(0, 20).map((promo, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Offer",
        "@id": `${baseUrl}/${locale}/promo/${promo.id}`,
        "name": promo.title,
        "description": promo.description,
        "category": getPromoTypeLabel(promo.type, language),
        "availability": promo.expiryDate 
          ? (new Date(promo.expiryDate) > new Date() 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock")
          : "https://schema.org/InStock",
        "validFrom": promo.startDate || promo.createdAt,
        "validThrough": promo.expiryDate,
        "seller": {
          "@type": "Organization",
          "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#merchant`,
          "name": storeName
        },
        "offeredBy": {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          "name": "Cobonat"
        },
        "url": promo.url || `${baseUrl}/${locale}/stores/${storeTranslation?.slug}#promo-${promo.id}`,
        ...(promo.image && { "image": promo.image }),
        ...(promo.terms && { "disambiguatingDescription": promo.terms })
      }
    }))
  } : null;

  // ============================================================================
  // 6. STORE PRODUCTS - ItemList for Featured Products
  // ✅ NEW! From Prisma StoreProduct model
  // ============================================================================
  const storeProductsSchema = storeProducts.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#products`,
    "name": language === 'ar' 
      ? `منتجات مميزة من ${storeName}` 
      : `Featured Products from ${storeName}`,
    "description": language === 'ar'
      ? `منتجات مخفضة ومميزة من ${storeName}`
      : `Discounted and featured products from ${storeName}`,
    "itemListElement": storeProducts.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "@id": `${baseUrl}/${locale}/product/${product.id}`,
        "name": product.title,
        "description": product.description,
        "image": product.image,
        "url": product.productUrl,
        "offers": {
          "@type": "Offer",
          "price": product.discountValue || "0",
          "priceCurrency": country?.currency || "SAR",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          "seller": {
            "@type": "Organization",
            "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#merchant`,
            "name": storeName
          },
          "offeredBy": {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            "name": "Cobonat"
          },
          // ✅ Discount info from Prisma model
          ...(product.discountValue && product.discountType === 'PERCENTAGE' && {
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": product.discountValue,
              "priceCurrency": "%"
            }
          })
        },
        "brand": {
          "@type": "Brand",
          "name": storeName
        }
      }
    }))
  } : null;

  // ============================================================================
  // 7. WebPage Schema - Links everything together
  // ✅ Uses seoTitle and seoDescription if available
  // ============================================================================
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}`,
    "url": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}`,
    // ✅ Use SEO title if available, otherwise generate
    "name": seoTitle || `${storeName} ${language === 'ar' ? 'كوبونات وعروض' : 'Coupons & Deals'}`,
    "headline": seoTitle || `${storeName} ${language === 'ar' ? 'كوبونات وعروض' : 'Coupons & Deals'}`,
    // ✅ Use SEO description if available, otherwise use store description
    "description": seoDescription || storeDescription || `${language === 'ar' ? 'احصل على أفضل كوبونات' : 'Get the best coupons for'} ${storeName}`,
    "inLanguage": language,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`  // ✅ Matches WebSiteStructuredData
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,  // ✅ Cobonat is the publisher
      "name": "Cobonat"
    },
    "about": {
      "@type": "Organization",
      "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#merchant`,
      "name": storeName
    },
    "breadcrumb": breadcrumbs.length > 0 ? {
      "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#breadcrumb`
    } : undefined,
    // ✅ Link to all offer/product catalogs
    "hasPart": [
      vouchers.length > 0 ? {
        "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#vouchers`
      } : null,
      otherPromos.length > 0 ? {
        "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#promotions`
      } : null,
      storeProducts.length > 0 ? {
        "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#products`
      } : null
    ].filter(Boolean),
    "datePublished": store.createdAt,
    "dateModified": store.updatedAt || store.createdAt,
    // ✅ Add cover image if available (from Prisma schema)
    ...(store.coverImage && {
      "image": {
        "@type": "ImageObject",
        "url": store.coverImage,
        "width": 1200,
        "height": 630
      }
    })
  };

  // ============================================================================
  // 8. AggregateRating Schema (if available)
  // ============================================================================
  const ratingSchema = aggregateRating ? {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "Organization",
      "@id": `${baseUrl}/${locale}/stores/${storeTranslation?.slug}/#merchant`
    },
    "ratingValue": aggregateRating.ratingValue,
    "reviewCount": aggregateRating.reviewCount,
    "bestRating": "5",
    "worstRating": "1"
  } : null;

  // ============================================================================
  // 9. LocalBusiness Schema (if store has physical presence)
  // ============================================================================
  const localBusinessSchema = store.hasPhysicalStore ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": storeName,
    "image": store.logo,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": countryCode
    },
    "url": store.websiteUrl || store.website,
    "priceRange": "$$"
  } : null;

  // ============================================================================
  // Combine all schemas (order matters for some parsers)
  // ============================================================================
  const schemas = [
    platformOrganizationSchema,  // Cobonat platform (must be first)
    storeOrganizationSchema,     // Store merchant
    breadcrumbSchema,
    voucherListSchema,           // Regular vouchers/coupons
    otherPromosSchema,           // Bank/payment/seasonal offers
    storeProductsSchema,         // ✅ Featured products
    webPageSchema,               // Page metadata (links everything)
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get promo type labels based on PromoType enum
 */
function getPromoTypeLabel(type, language) {
  const labels = {
    'BANK_OFFER': {
      ar: 'عرض بنكي',
      en: 'Bank Offer'
    },
    'CARD_OFFER': {
      ar: 'عرض بطاقة',
      en: 'Card Offer'
    },
    'PAYMENT_OFFER': {
      ar: 'عرض دفع',
      en: 'Payment Offer'
    },
    'SEASONAL': {
      ar: 'عرض موسمي',
      en: 'Seasonal Offer'
    },
    'BUNDLE': {
      ar: 'عرض حزمة',
      en: 'Bundle Deal'
    },
    'OTHER': {
      ar: 'عرض خاص',
      en: 'Special Offer'
    }
  };

  return labels[type]?.[language === 'ar' ? 'ar' : 'en'] || 'Special Offer';
}
