// components/StructuredData/WebSiteStructuredData.jsx
/**
 * FINAL WebSite and Organization Structured Data Component
 * ✅ Fully aligned with StoreStructuredData
 * ✅ Consistent @id references across all pages
 * ✅ Matches Prisma schema structure
 * ✅ FIXED: SearchAction urlTemplate uses literal {search_term_string} – Google will not crawl it
 * ✅ FIXED: No href attributes that could expose the template as a crawlable URL
 */

export default function WebSiteStructuredData({ locale }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const isArabic = locale?.startsWith('ar') || false;
  
  // The search template MUST contain the literal string {search_term_string}
  // This is standard Schema.org syntax – Google understands it and will NOT crawl it as a URL
  // The placeholder is replaced client-side when a user actually performs a search
  const searchUrlTemplate = `${baseUrl}/${locale}/search?q={search_term_string}`;

  // ============================================================================
  // 1. ORGANIZATION SCHEMA
  // ============================================================================
  const organizationSchema = {
    "@context": "https://schema.org",
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
    "name": isArabic ? "كوبونات" : "Cobonat", 
    "alternateName": isArabic ? "كوبونات السعودية" : "Saudi Coupons",
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
        // ✅ CRITICAL FIX: Must contain the literal string {search_term_string}
        // This is correct Schema.org syntax. Google will NOT crawl this as a URL.
        // It is a template that gets populated when a user actually searches.
        "urlTemplate": searchUrlTemplate
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
