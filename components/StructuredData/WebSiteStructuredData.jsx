// components/StructuredData/WebSiteStructuredData.jsx
/**
 * WebSite and Organization Structured Data Component
 * This fixes the "Vercel" branding issue in Google search results
 * and ensures your Cobonat logo appears properly
 */

export default function WebSiteStructuredData({ locale }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const isArabic = locale?.startsWith('ar') || false;
  
  // ============================================================================
  // 1. ORGANIZATION SCHEMA - This is what Google uses for site name and logo
  // ============================================================================
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "Cobonat",  // ✅ FIXED: Always use brand name
    "alternateName": isArabic ? "كوبونات" : "Cobonat",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-512x512.png`,  // ✅ ADDED: High-res logo for Google
      "width": 512,
      "height": 512,
      "caption": "Cobonat Logo"
    },
    "image": `${baseUrl}/logo-512x512.png`,  // ✅ ADDED: Alternative image field
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
    }
  };

  // ============================================================================
  // 2. WEBSITE SCHEMA - For search functionality and site metadata
  // ============================================================================
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "Cobonat",  // ✅ FIXED: Always use brand name
    "alternateName": isArabic ? "كوبونات السعودية" : "Saudi Coupons",
    "url": `${baseUrl}/${locale}`,
    "description": isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    "inLanguage": locale || "ar-SA",
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`  // ✅ ADDED: Links to organization above
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/${locale}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // ============================================================================
  // Render both schemas
  // ============================================================================
  return (
    <>
      {/* Organization Schema - Google uses this for site name and logo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(organizationSchema) 
        }}
      />
      
      {/* WebSite Schema - For search functionality */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(websiteSchema) 
        }}
      />
    </>
  );
}
