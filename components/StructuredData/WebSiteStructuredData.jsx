/**
 * CORRECTED WebSite and Organization Structured Data Component
 * ✅ Enforces strict Organization type
 * ✅ Removes fabricated postal codes and invalid founder types
 * ✅ Consolidates into a single @graph for bulletproof entity linking
 */

export default function WebSiteStructuredData({ locale }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const isArabic = locale?.startsWith('ar') || false;
  
  const searchUrlTemplate = `${baseUrl}/${locale}/search?q={search_term_string}`;

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      // 1. ORGANIZATION SCHEMA
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": isArabic ? "كوبونات" : "Cobonat", 
        "alternateName": isArabic ? "Cobonat" : "كوبونات",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo-512x512.png`,
          "width": 512,
          "height": 512,
          "caption": "Cobonat Logo"
        },
        "image": `${baseUrl}/logo-512x512.png`,
        "description": isArabic
          ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية."
          : "Your #1 source for verified discount codes in Saudi. Save more with verified coupons for top local and global stores.",
        "sameAs": [
          "https://www.facebook.com/cobonatme",
          "https://t.me/cobonatme",
          "https://www.tiktok.com/@cobonatme",
          "https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Service",
          "url": `${baseUrl}/${locale}/contact`,
          "availableLanguage": ["Arabic", "English"]
        }
      },
      
      // 2. WEBSITE SCHEMA
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "name": isArabic ? "كوبونات" : "Cobonat", 
        "alternateName": isArabic ? "كوبونات السعودية" : "Saudi Coupons",
        "url": baseUrl, 
        "description": isArabic
          ? "منصتك الأولى لأكواد الخصم والعروض في السعودية."
          : "Your #1 source for verified discount codes in Saudi.",
        "inLanguage": locale || "ar-SA",
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": searchUrlTemplate
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify(schemaGraph) 
      }}
    />
  );
}
