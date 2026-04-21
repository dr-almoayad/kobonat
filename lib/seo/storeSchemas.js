// lib/seo/storeSchemas.js
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

/**
 * Generates FAQPage schema by merging dynamic DB FAQs with 
 * high-intent "Saudi Expert" authority questions.
 */
function generateFAQSchema({ customFaqs, storeName, locale, voucherCount, maxSavings }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const language = isAr ? 'ar' : 'en';

  // 1. Map Prisma FAQs into Schema.org format
  const mappedCustomFaqs = (customFaqs || []).map(faq => {
    const translation = faq.translations?.find(t => t.locale === language) || faq.translations?.[0];
    if (!translation?.question || !translation?.answer) return null;
    
    return {
      "@type": "Question",
      "name": translation.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": translation.answer
      }
    };
  }).filter(Boolean);

  // 2. Prepend a "Saudi Authority" question (High-intent long-tail)
  if (isAr) {
    mappedCustomFaqs.unshift({
      "@type": "Question",
      "name": `هل أكواد خصم ${storeName} فعالة حالياً في السعودية؟`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `نعم، جميع كوبونات ${storeName} المتاحة في "كوبونات" محدثة ومجربة لعام 2026. لدينا حالياً ${voucherCount} عرض نشط يوفر لك ما يصل إلى ${maxSavings}% عند التسوق من داخل المملكة.`
      }
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mappedCustomFaqs
  };
}

/**
 * Generates AggregateOffer schema to get the "Offers" price range snippet in Google.
 */
function generateAggregateOfferSchema({ storeName, storeSlug, voucherCount, maxSavings, locale }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const brandName = isAr ? "كوبونات" : "Cobonat";

  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    "name": isAr ? `عروض وكوبونات ${storeName}` : `${storeName} Coupons & Offers`,
    "offerCount": voucherCount || 1,
    "priceCurrency": "SAR",
    "lowPrice": "0",
    "highPrice": maxSavings || "70",
    "offers": {
      "@type": "Offer",
      "url": `${BASE_URL}/${locale}/stores/${storeSlug}`,
      "offeredBy": {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        "name": brandName
      }
    }
  };
}

/**
 * Generates WebPage and Breadcrumb schemas.
 */
function generateStoreWebPageSchema({ storeName, storeSlug, title, description, locale, updatedAt }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;
  const brandName = isAr ? "كوبونات" : "Cobonat";

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}/#webpage`,
    "url": pageUrl,
    "name": title,
    "description": description,
    "lastReviewed": updatedAt,
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": brandName
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": isAr ? 'الرئيسية' : 'Home', "item": `${BASE_URL}/${locale}` },
        { "@type": "ListItem", "position": 2, "name": isAr ? 'المتاجر' : 'Stores', "item": `${BASE_URL}/${locale}/stores` },
        { "@type": "ListItem", "position": 3, "name": isAr ? `كوبونات ${storeName}` : `${storeName} Coupons`, "item": pageUrl }
      ]
    }
  };
}

/**
 * Main component to inject all Store schemas.
 * Place this in your app/[locale]/stores/[slug]/page.jsx
 */
export function StoreStructuredSchemas({
  storeName,
  storeSlug,
  storeUrl,
  title,
  description,
  locale,
  voucherCount,
  maxSavings,
  updatedAt,
  faqs // Pass the raw array from transformedStore.faq
}) {
  const faqSchema = generateFAQSchema({ 
    customFaqs: faqs, 
    storeName, 
    locale, 
    voucherCount, 
    maxSavings 
  });
  
  const offerSchema = generateAggregateOfferSchema({ 
    storeName, 
    storeSlug, 
    voucherCount, 
    maxSavings, 
    locale 
  });

  const webPageSchema = generateStoreWebPageSchema({ 
    storeName, 
    storeSlug, 
    title, 
    description, 
    locale, 
    updatedAt 
  });

  const schemas = [faqSchema, offerSchema, webPageSchema];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
