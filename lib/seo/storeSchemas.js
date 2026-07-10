// lib/seo/storeSchemas.js
// ✅ FULLY CORRECTED VERSION
// - Removed generalFaqs (prevents duplicate FAQ items on every store page)
// - Uses dateModified (not lastReviewed) for freshness
// - No fallback date – only uses real updatedAt
// - FAQPage nested inside WebPage's mainEntity (proper Schema.org structure)

import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

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
  breadcrumbs = [],
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

  // ── 1. WebPage ──
  const webPage = {
    '@type': 'WebPage',
    '@id': `${pageUrl}/#webpage`,
    url: pageUrl,
    name: title,
    description: description,
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: brandName,
    },
  };

  // ✅ Only add dateModified if we have a real date
  if (updatedAt) {
    webPage.dateModified = new Date(updatedAt).toISOString();
  }

  graph.push(webPage);

  // ── 2. BreadcrumbList ──
  let breadcrumbList;
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

  // ── 3. FAQPage (only store‑specific FAQs) ──
  const mappedCustomFaqs = (faqs || [])
    .map((faq) => {
      const translation = faq.translations?.find((t) => t.locale === language) || faq.translations?.[0];
      if (!translation?.question || !translation?.answer) return null;
      return {
        '@type': 'Question',
        name: translation.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(translation.answer),
        },
      };
    })
    .filter(Boolean);

  // ✅ Nest FAQPage inside WebPage's mainEntity
  if (mappedCustomFaqs.length > 0) {
    const webPageIndex = graph.findIndex((item) => item['@type'] === 'WebPage');
    if (webPageIndex !== -1) {
      graph[webPageIndex].mainEntity = {
        '@type': 'FAQPage',
        mainEntity: mappedCustomFaqs,
      };
    } else {
      // Fallback (should not happen)
      graph.push({
        '@type': 'FAQPage',
        '@id': `${pageUrl}/#faq`,
        mainEntity: mappedCustomFaqs,
      });
    }
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
