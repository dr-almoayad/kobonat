// components/StructuredData/FAQStructuredData.jsx
'use client';

/**
 * FAQ Structured Data Component
 * 
 * Generates schema.org FAQPage markup for Google Search Console
 * Fixes missing "name" and "text" (acceptedAnswer) fields
 * 
 * @param {Array} faqs - Array of FAQ objects with translations
 * @param {string} locale - Current locale (e.g., 'en-SA', 'ar-SA')
 */
export default function FAQStructuredData({ faqs, locale }) {
  // Don't render if no FAQs
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Extract language from locale
  const language = locale ? locale.split('-')[0] : 'en';

  // Build FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs
      .filter(faq => faq.isActive !== false) // Only include active FAQs
      .map(faq => {
        // Get translation for current locale
        const translation = faq.translations?.find(t => t.locale === language) || faq.translations?.[0];
        
        if (!translation || !translation.question || !translation.answer) {
          return null; // Skip if missing required fields
        }

        return {
          "@type": "Question",
          "name": translation.question, // ✅ REQUIRED: The question text
          "acceptedAnswer": {
            "@type": "Answer",
            "text": translation.answer // ✅ REQUIRED: The answer text
          }
        };
      })
      .filter(Boolean) // Remove null entries
  };

  // Only render if we have valid FAQs
  if (faqSchema.mainEntity.length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema)
      }}
    />
  );
}
