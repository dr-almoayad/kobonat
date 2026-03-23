// components/StructuredData/BlogPostStructuredData.jsx
// Emits: BlogPosting, BreadcrumbList, and optionally FAQPage (from faqJson)

export default function BlogPostStructuredData({ post, locale, baseUrl }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';
  
  // ✅ Dynamic Brand Name for Site Name consistency
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  // ── 1. BlogPosting ─────────────────────────────────────────────────────
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type':    'BlogPosting',
    '@id':      `${baseUrl}/${locale}/blog/${post.slug}`,
    url:        `${baseUrl}/${locale}/blog/${post.slug}`,
    headline:      post.metaTitle || post.title,
    name:          post.title,
    description:   post.metaDescription || post.excerpt,
    articleBody:   post.excerpt,
    inLanguage:    lang,
    datePublished: post.publishedAt,
    dateModified:  post.updatedAt || post.publishedAt,
    isPartOf:  { '@type': 'WebSite',      '@id': `${baseUrl}/#website` },
    // ✅ FIX: Use dynamic brandName here
    publisher: { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: brandName },
    ...(post.featuredImage && {
      image: { '@type': 'ImageObject', url: post.featuredImage, width: 1200, height: 630 },
    }),
    ...(post.author && {
      author: {
        '@type': 'Person',
        name: lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
        url:  `${baseUrl}/${locale}/authors/${post.author.slug}`,
      },
    }),
  };

  // ── 2. Breadcrumbs ──────────────────────────────────────────────────────
  const crumbs = [
    { name: isAr ? 'الرئيسية' : 'Home', item: `${baseUrl}/${locale}` },
    { name: isAr ? 'المدونة' : 'Blog', item: `${baseUrl}/${locale}/blog` },
    ...(post.category ? [{
      name: post.category.translations?.find(t => t.locale === lang)?.name || post.category.slug,
      item: `${baseUrl}/${locale}/blog?category=${post.category.slug}`,
    }] : []),
    { name: post.title, item: `${baseUrl}/${locale}/blog/${post.slug}` },
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      name:      c.name,
      item:      c.item,
    })),
  };

  // ── 3. FAQPage ────────────────────────────────────────────────────────
  let faqSchema = null;
  if (post.faqJson) {
    try {
      const items = JSON.parse(post.faqJson);
      if (Array.isArray(items) && items.length > 0) {
        faqSchema = {
          '@context': 'https://schema.org',
          '@type':    'FAQPage',
          mainEntity: items.map(item => ({
            '@type':          'Question',
            name:             item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        };
      }
    } catch { /* skip */ }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
    </>
  );
}
