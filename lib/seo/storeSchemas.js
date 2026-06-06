// lib/seo/storeSchemas.js
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

/**
 * Main component to inject a unified, penalty‑free schema graph.
 * ✅ FIX: Uses passed `breadcrumbs` prop instead of hardcoding.
 * ✅ FIX: Encodes all URLs with encodeURI() to handle non‑ASCII characters.
 * ✅ FIX: Merges Store FAQs with General FAQs into a single FAQPage entity.
 */
export function StoreStructuredSchemas({
  storeName,
  storeSlug,
  title,
  description,
  locale,
  updatedAt,
  faqs,
  generalFaqs = [],
  breadcrumbs = [], // ✅ now used
}) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const language = isAr ? 'ar' : 'en';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;

  // Helper to encode URL for JSON‑LD (ensures ASCII)
  const encodeSchemaUrl = (url) => {
    if (!url) return url;
    try {
      // Parse the URL to encode only the path (not protocol or domain)
      const urlObj = new URL(url);
      urlObj.pathname = encodeURI(urlObj.pathname);
      return urlObj.toString();
    } catch {
      // Fallback: encode the whole string
      return encodeURI(url);
    }
  };

  const graph = [];

  // 1. WebPage Schema (primary entity)
  graph.push({
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
  });

  // 2. BreadcrumbList Schema – use provided breadcrumbs if available
  let breadcrumbList = null;
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    const itemListElement = breadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: encodeSchemaUrl(item.url),
    }));
    breadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}/#breadcrumb`,
      itemListElement,
    };
  } else {
    // Fallback hardcoded (for pages that don't pass breadcrumbs)
    breadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: isAr ? 'الرئيسية' : 'Home',
          item: encodeSchemaUrl(`${BASE_URL}/${locale}`),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isAr ? 'المتاجر' : 'Stores',
          item: encodeSchemaUrl(`${BASE_URL}/${locale}/stores`),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: isAr ? `كوبونات ${storeName}` : `${storeName} Coupons`,
          item: encodeSchemaUrl(pageUrl),
        },
      ],
    };
  }
  graph.push(breadcrumbList);

  // 3. FAQPage Schema (merge store FAQs and general FAQs)
  const mappedCustomFaqs = (faqs || [])
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

  const combinedFaqs = [...mappedCustomFaqs, ...generalFaqs];

  if (combinedFaqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}/#faq`,
      isPartOf: { '@id': `${pageUrl}/#webpage` },
      mainEntity: combinedFaqs,
    });
  }

  const unifiedSchema = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchema) }}
    />
  );
}
