// lib/seo/storeSchemas.js
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

/**
 * Main component to inject a unified, penalty-free schema graph.
 * ✅ FIX: Removed toxic Offer schema that violated Google guidelines.
 * ✅ FIX: Consolidated everything into a single @graph object to prevent entity confusion.
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
  generalFaqs = [], // Accepted from the page component
}) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const language = isAr ? 'ar' : 'en';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';
  const pageUrl = `${BASE_URL}/${locale}/stores/${storeSlug}`;

  const graph = [];

  // 1. WebPage Schema (The primary entity)
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
    breadcrumb: {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}/#breadcrumb`,
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
  });

  // 2. Map Store-Specific FAQs
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

  // 3. Merge Store FAQs with General FAQs
  const combinedFaqs = [...mappedCustomFaqs, ...generalFaqs];

  // 4. Inject Single FAQPage Schema
  if (combinedFaqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}/#faq`,
      isPartOf: { '@id': `${pageUrl}/#webpage` },
      mainEntity: combinedFaqs,
    });
  }

  // Wrap the entire payload in the Schema.org @graph syntax
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