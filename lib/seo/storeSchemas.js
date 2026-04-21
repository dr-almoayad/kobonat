// lib/seo/storeSchemas.js
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

/**
 * Generates FAQPage schema dynamically from database FAQs.
 * Only includes Q&A pairs that are also displayed in the UI (StoreFAQ component).
 */
function generateFAQSchema({ customFaqs, storeName, locale, voucherCount, maxSavings }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const language = isAr ? 'ar' : 'en';

  // Map Prisma FAQs into Schema.org format – exactly what the user sees
  const mappedCustomFaqs = (customFaqs || [])
    .map((faq) => {
      const translation = faq.translations?.find((t) => t.locale === language) || faq.translations?.[0];
      if (!translation?.question || !translation?.answer) return null;
      return {
        '@type': 'Question',
        name: translation.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: translation.answer,
        },
      };
    })
    .filter(Boolean);

  if (mappedCustomFaqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mappedCustomFaqs,
  };
}

/**
 * Generates a standard Offer schema.
 * Only includes savings copy when maxSavings is a real positive number —
 * never falls back to a made-up figure, which would risk a Google policy issue.
 */
function generateOfferSchema({ storeName, storeSlug, voucherCount, maxSavings, locale }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;

  // Build description conditionally — only mention savings when the figure is real.
  const savingsSuffix = maxSavings > 0
    ? (isAr ? `، توفير يصل إلى ${maxSavings}%` : `, save up to ${maxSavings}%`)
    : '';

  const description = isAr
    ? `${voucherCount || 0}+ كود خصم فعّال${savingsSuffix}`
    : `${voucherCount || 0}+ active discount codes${savingsSuffix}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    '@id': `${pageUrl}/#offer`,
    name: isAr ? `كوبونات ${storeName}` : `${storeName} Coupons`,
    description,
    url: pageUrl,
    price: 0,
    priceCurrency: 'SAR',
    availability: 'https://schema.org/OnlineOnly',
    eligibleRegion: {
      '@type': 'Country',
      name: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia',
      identifier: 'SA',
    },
    offeredBy: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: brandName,
    },
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: 0,
      priceCurrency: 'SAR',
      description: isAr ? 'استخدام الكوبون مجاني تماماً' : 'Coupon usage is completely free',
    },
  };
}

/**
 * Generates WebPage schema with embedded breadcrumb.
 */
function generateStoreWebPageSchema({ storeName, storeSlug, title, description, locale, updatedAt }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}/#webpage`,
    url: pageUrl,
    name: title,
    description: description,
    lastReviewed: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: brandName,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: isAr ? 'الرئيسية' : 'Home',
          item: `${BASE_URL}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isAr ? 'المتاجر' : 'Stores',
          item: `${BASE_URL}/${locale}/stores`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: isAr ? `كوبونات ${storeName}` : `${storeName} Coupons`,
          item: pageUrl,
        },
      ],
    },
  };
}

/**
 * Main component to inject all store schemas.
 *
 * @param {Object}        props
 * @param {string}        props.storeName     - Localised store name
 * @param {string}        props.storeSlug     - Localised store slug
 * @param {string}        props.title         - Page title (used in WebPage)
 * @param {string}        props.description   - Page meta description
 * @param {string}        props.locale        - e.g., 'ar-SA', 'en-SA'
 * @param {number}        props.voucherCount  - Total active vouchers
 * @param {number}        props.maxSavings    - Maximum possible savings % (0 = unknown)
 * @param {string|Date}   props.updatedAt     - Last time store data was updated
 * @param {Array}         props.faqs          - Raw Prisma StoreFAQ array with translations[]
 */
export function StoreStructuredSchemas({
  storeName,
  storeSlug,
  title,
  description,
  locale,
  voucherCount,
  maxSavings,
  updatedAt,
  faqs,
}) {
  const schemas = [];

  // 1. FAQ schema (only if there are valid FAQs)
  const faqSchema = generateFAQSchema({ customFaqs: faqs, storeName, locale, voucherCount, maxSavings });
  if (faqSchema) schemas.push(faqSchema);

  // 2. Offer schema (always include)
  const offerSchema = generateOfferSchema({ storeName, storeSlug, voucherCount, maxSavings, locale });
  schemas.push(offerSchema);

  // 3. WebPage schema (always include)
  const webPageSchema = generateStoreWebPageSchema({
    storeName,
    storeSlug,
    title,
    description,
    locale,
    updatedAt,
  });
  schemas.push(webPageSchema);

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
