// components/StructuredData/WebSiteStructuredData.jsx
/**
 * FINAL WebSite and Organization Structured Data Component
 * ✅ Fully aligned with StoreStructuredData
 * ✅ Consistent @id references across all pages
 * ✅ Matches Prisma schema structure
 */

export default function WebSiteStructuredData({ locale }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const isArabic = locale?.startsWith('ar') || false;
  
  // ============================================================================
  // 1. ORGANIZATION SCHEMA
  // ============================================================================
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    // ✅ FIX: Make the primary name dynamic based on the locale 
    "name": isArabic ? "كوبونات" : "Cobonat", 
    "alternateName": isArabic ? "Cobonat" : "كوبونات",
    "url": baseUrl, // Root URL
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-512x512.png`,
      "width": 512,
      "height": 512,
      "caption": "Cobonat Logo"
    },
    "image": `${baseUrl}/logo-512x512.png`,
    "description": isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
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
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SA"
    },
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Organization",
        "name": "Cobonat"
      }
    ]
  };

  // ============================================================================
  // 2. WEBSITE SCHEMA
  // ============================================================================
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    // ✅ FIX: Ensure the primary name matches what you want displayed in Google
    "name": isArabic ? "كوبونات" : "Cobonat", 
    "alternateName": isArabic ? "كوبونات السعودية" : "Saudi Coupons",
    // ✅ CRITICAL FIX: Google requires the WebSite URL to be the root domain
    "url": baseUrl, 
    "description": isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    "inLanguage": locale || "ar-SA",
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        // Search action can still target the localized path
        "urlTemplate": `${baseUrl}/${locale}/search?q={search_term_string}` 
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(organizationSchema) 
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(websiteSchema) 
        }}
      />
    </>
  );
}
