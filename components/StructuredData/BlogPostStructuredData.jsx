// components/StructuredData/BlogPostStructuredData.jsx
// Emits: BlogPosting, BreadcrumbList, and optionally FAQPage (from faqJson)

export default function BlogPostStructuredData({ post, locale, baseUrl }) {
  const lang = locale?.split('-')[0] || 'ar';

  // ── 1. BlogPosting ─────────────────────────────────────────────────────
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type':    'BlogPosting',
    '@id':      `${baseUrl}/${locale}/blog/${post.slug}`,
    url:        `${baseUrl}/${locale}/blog/${post.slug}`,
    headline:      post.metaTitle || post.title,
    name:          post.title,
    description:   post.metaDescription || post.excerpt,
    articleBody:   post.excerpt,  // intentional: never dump raw HTML here
    inLanguage:    lang,
    datePublished: post.publishedAt,
    dateModified:  post.updatedAt || post.publishedAt,
    isPartOf:  { '@type': 'WebSite',      '@id': `${baseUrl}/#website` },
    publisher: { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: 'Cobonat' },
    ...(post.featuredImage && {
      image: { '@type': 'ImageObject', url: post.featuredImage, width: 1200, height: 630 },
    }),
    ...(post.author && {
      author: {
        '@type': 'Person',
        name: lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
        ...(post.author.avatar && { image: post.author.avatar }),
        ...(post.author.twitterHandle && {
          sameAs: [`https://twitter.com/${post.author.twitterHandle}`],
        }),
      },
    }),
    ...(post.category && {
      articleSection: post.category.translations?.[0]?.name || post.category.slug,
    }),
    ...(post.readingTime && {
      timeRequired: `PT${post.readingTime}M`,
    }),
  };

  // ── 2. BreadcrumbList ──────────────────────────────────────────────────
  const crumbs = [
    { name: lang === 'ar' ? 'الرئيسية' : 'Home', item: `${baseUrl}/${locale}` },
    { name: lang === 'ar' ? 'المدونة'  : 'Blog', item: `${baseUrl}/${locale}/blog` },
    ...(post.category ? [{
      name: post.category.translations?.[0]?.name || post.category.slug,
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

  // ── 3. FAQPage (only if faqJson is present and valid) ─────────────────
  let faqSchema = null;
  if (post.faqJson) {
    try {
      const items = JSON.parse(post.faqJson);
      if (Array.isArray(items) && items.length > 0 && items.every(i => i.q && i.a)) {
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
    } catch { /* invalid JSON — skip */ }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
    </>
  );
}
