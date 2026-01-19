// lib/seo/faqSchema.js - FAQ Structured Data Generator

/**
 * Generates FAQPage JSON-LD schema for Google rich results
 * @param {Array} faqs - Array of FAQ objects with question/answer
 * @param {string} locale - Current locale (e.g., 'ar-SA', 'en-SA')
 * @returns {Object} JSON-LD schema
 */
export function generateFAQSchema(faqs, locale = 'ar-SA') {
  if (!faqs || faqs.length === 0) return null;

  const isArabic = locale.startsWith('ar');

  const mainEntity = faqs.map(faq => ({
    "@type": "Question",
    "name": isArabic ? faq.question_ar : faq.question_en,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": isArabic ? faq.answer_ar : faq.answer_en
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity
  };
}

/**
 * React component to inject FAQ schema into page
 * Usage in Next.js page:
 * 
 * import { FAQSchema } from '@/lib/seo/faqSchema';
 * 
 * export default function StorePage({ faqs, locale }) {
 *   return (
 *     <>
 *       <FAQSchema faqs={faqs} locale={locale} />
 *       ...rest of page
 *     </>
 *   );
 * }
 */
export function FAQSchema({ faqs, locale }) {
  const schema = generateFAQSchema(faqs, locale);
  
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Alternative: Get schema as string for direct injection
 * Useful for server-side rendering or custom head management
 */
export function getFAQSchemaString(faqs, locale = 'ar-SA') {
  const schema = generateFAQSchema(faqs, locale);
  return schema ? JSON.stringify(schema) : null;
}