// components/StructuredData/BlogStructuredData.jsx

export default function BlogStructuredData({ locale, baseUrl, posts = [] }) {
  const lang   = locale?.split('-')[0] || 'ar';
  const isAr   = lang === 'ar';
  const blogUrl = `${baseUrl}/${locale}/blog`;
  
  // ✅ Dynamic Brand Name for Site Name consistency
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  // ── 1. Breadcrumb ──────────────────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: `${baseUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'المدونة' : 'Blog', item: blogUrl },
    ],
  };

  // ── 2. CollectionPage ──────────────────────────────────────────────────
  const collectionPageSchema = {
    '@context':   'https://schema.org',
    '@type':      'CollectionPage',
    '@id':        blogUrl,
    url:          blogUrl,
    name:         isAr ? 'مدونة كوبونات' : 'Cobonat Blog',
    isPartOf:     { '@type': 'WebSite', '@id': `${baseUrl}/#website` },
    // ✅ FIX: Use dynamic brandName here
    publisher:    { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: brandName },
  };

  // ── 3. Blog Schema ─────────────────────────────────────────────────────
  let blogSchema = null;
  if (posts.length > 0) {
    blogSchema = {
      '@context': 'https://schema.org',
      '@type':    'Blog',
      '@id':        blogUrl,
      url:        blogUrl,
      name:       isAr ? 'مدونة كوبونات' : 'Cobonat Blog',
      // ✅ FIX: Use dynamic brandName here
      publisher: {
        '@type': 'Organization',
        '@id':   `${baseUrl}/#organization`,
        name:    brandName,
      },
      blogPost: posts.filter(p => p.title && p.slug).map(p => ({
          '@type':        'BlogPosting',
          '@id':          `${baseUrl}/${locale}/blog/${p.slug}`,
          url:            `${baseUrl}/${locale}/blog/${p.slug}`,
          headline:       p.title,
          publisher:      { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: brandName }
      })),
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
      {blogSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />}
    </>
  );
}
