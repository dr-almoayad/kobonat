// components/StructuredData/BlogStructuredData.jsx
// Emits three schemas for the /blog index page:
//  1. BreadcrumbList
//  2. CollectionPage (the listing)
//  3. Blog + ItemList (top posts — only when posts are passed in)

export default function BlogStructuredData({ locale, baseUrl, posts = [], categories = [] }) {
  const lang   = locale?.split('-')[0] || 'ar';
  const isAr   = lang === 'ar';
  const blogUrl = `${baseUrl}/${locale}/blog`;

  // ── 1. Breadcrumb ──────────────────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      {
        '@type':  'ListItem',
        position: 1,
        name:     isAr ? 'الرئيسية' : 'Home',
        item:     `${baseUrl}/${locale}`,
      },
      {
        '@type':  'ListItem',
        position: 2,
        name:     isAr ? 'المدونة' : 'Blog',
        item:     blogUrl,
      },
    ],
  };

  // ── 2. CollectionPage ──────────────────────────────────────────────────
  const collectionPageSchema = {
    '@context':   'https://schema.org',
    '@type':      'CollectionPage',
    '@id':        blogUrl,
    url:          blogUrl,
    name:         isAr
      ? 'مدونة كوبونات | نصائح التوفير والعروض والمقارنات'
      : 'Cobonat Blog | Saving Tips, Deals & Comparisons',
    description:  isAr
      ? 'أحدث نصائح التوفير، مقارنات المتاجر، أفضل البطاقات البنكية، وأكواد الخصم في السعودية'
      : 'Latest saving tips, store comparisons, credit card guides, and promo codes in Saudi Arabia',
    inLanguage:   lang,
    isPartOf: {
      '@type': 'WebSite',
      '@id':   `${baseUrl}/#website`,
    },
    publisher: {
      '@type': 'Organization',
      '@id':   `${baseUrl}/#organization`,
    },
    // Link to all categories as subject-of
    ...(categories.length > 0 && {
      about: categories.slice(0, 10).map(cat => ({
        '@type': 'Thing',
        name:    cat.translations?.[0]?.name || cat.slug,
      })),
    }),
  };

  // ── 3. Blog + ItemList (only when top posts are passed) ────────────────
  let blogSchema = null;
  if (posts.length > 0) {
    blogSchema = {
      '@context': 'https://schema.org',
      '@type':    'Blog',
      '@id':      `${blogUrl}#blog`,
      url:        blogUrl,
      name:       isAr ? 'مدونة كوبونات' : 'Cobonat Blog',
      publisher: {
        '@type': 'Organization',
        '@id':   `${baseUrl}/#organization`,
        name:    'Cobonat',
      },
      blogPost: posts
        .filter(p => p.title && p.slug)
        .map(p => ({
          '@type':        'BlogPosting',
          '@id':          `${baseUrl}/${locale}/blog/${p.slug}`,
          url:            `${baseUrl}/${locale}/blog/${p.slug}`,
          headline:       p.title,
          ...(p.excerpt && { description: p.excerpt }),
          ...(p.featuredImage && {
            image: { '@type': 'ImageObject', url: p.featuredImage },
          }),
          ...(p.publishedAt && {
            datePublished: new Date(p.publishedAt).toISOString(),
          }),
          ...(p.author?.name && {
            author: { '@type': 'Person', name: p.author.name },
          }),
          ...(p.category?.name && {
            articleSection: p.category.name,
          }),
        })),
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      {blogSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
      )}
    </>
  );
}
