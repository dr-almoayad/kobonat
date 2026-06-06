// lib/seo/storeSchemas.js
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Helper to strip HTML for JSON‑LD answers
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function StoreStructuredSchemas({
  storeName,
  storeSlug,
  title,
  description,
  locale,
  updatedAt,
  faqs,
  generalFaqs = [],
  breadcrumbs = [], // now used
}) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const language = isAr ? 'ar' : 'en';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;

  const encodeSchemaUrl = (url) => {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      urlObj.pathname = encodeURI(urlObj.pathname);
      return urlObj.toString();
    } catch {
      return encodeURI(url);
    }
  };

  const graph = [];

  // WebPage Schema
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

  // BreadcrumbList
  let breadcrumbList = null;
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    breadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}/#breadcrumb`,
      itemListElement: breadcrumbs.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: encodeSchemaUrl(item.url),
      })),
    };
  } else {
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

  // FAQPage – merge store FAQs and general FAQs
  const mappedCustomFaqs = (faqs || [])
    .map((faq) => {
      const translation = faq.translations?.find((t) => t.locale === language) || faq.translations?.[0];
      if (!translation?.question || !translation?.answer) return null;
      return {
        '@type': 'Question',
        name: translation.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(translation.answer), // ✅ plain text
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
