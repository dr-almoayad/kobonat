// components/StructuredData/FAQStructuredData.jsx
/**
 * FAQ Structured Data Component
 * ✅ FIX: Added publisher reference to reinforce site name ("كوبونات")
 * ✅ FIX: Consistent locale and baseUrl handling
 */

export default function FAQStructuredData({ faqs, locale }) {
  // Don't render if no FAQs
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const language = locale ? locale.split('-')[0] : 'ar';
  const isAr = language === 'ar';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  // Build FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    // ✅ Reference your platform to help Google identify the site name
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": brandName
    },
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
          "name": translation.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": translation.answer
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
