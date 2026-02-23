// components/StructuredData/BlogStructuredData.jsx
// Schema for /blog index page

export default function BlogStructuredData({ locale, baseUrl }) {
  const lang = locale?.split('-')[0] || 'ar';

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": lang === 'ar' ? "الرئيسية" : "Home",
        "item": `${baseUrl}/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": lang === 'ar' ? "المدونة" : "Blog",
        "item": `${baseUrl}/${locale}/blog`
      }
    ]
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/${locale}/blog`,
    "url":  `${baseUrl}/${locale}/blog`,
    "name": lang === 'ar' ? "مدونة كوبونات | نصائح التوفير والعروض" : "Cobonat Blog | Saving Tips & Deals",
    "description": lang === 'ar'
      ? "أحدث نصائح التوفير، مقارنات المتاجر، وأفضل عروض السعودية"
      : "Latest saving tips, store comparisons, and best deals in Saudi Arabia",
    "inLanguage": lang,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
    </>
  );
}
