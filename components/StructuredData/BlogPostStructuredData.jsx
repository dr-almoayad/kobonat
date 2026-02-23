// components/StructuredData/BlogPostStructuredData.jsx
// BlogPosting schema for individual post pages

export default function BlogPostStructuredData({ post, locale, baseUrl }) {
  const lang = locale?.split('-')[0] || 'ar';

  // ── 1. BlogPosting schema ──────────────────────────────────────────────
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${baseUrl}/${locale}/blog/${post.slug}`,
    "url":  `${baseUrl}/${locale}/blog/${post.slug}`,
    "headline":      post.metaTitle || post.title,
    "name":          post.title,
    "description":   post.metaDescription || post.excerpt,
    "articleBody":   post.excerpt,           // Summary — never dump full HTML here
    "inLanguage":    lang,
    "datePublished": post.publishedAt,
    "dateModified":  post.updatedAt || post.publishedAt,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "Cobonat"
    },
    ...(post.featuredImage && {
      "image": {
        "@type": "ImageObject",
        "url": post.featuredImage,
        "width": 1200,
        "height": 630
      }
    }),
    ...(post.author && {
      "author": {
        "@type": "Person",
        "name": lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
        ...(post.author.avatar && { "image": post.author.avatar }),
        ...(post.author.twitterHandle && {
          "sameAs": [`https://twitter.com/${post.author.twitterHandle}`]
        })
      }
    }),
    ...(post.category && {
      "articleSection": post.category.translations?.[0]?.name || post.category.slug
    })
  };

  // ── 2. BreadcrumbList ─────────────────────────────────────────────────
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
      },
      ...(post.category ? [{
        "@type": "ListItem",
        "position": 3,
        "name": post.category.translations?.[0]?.name || post.category.slug,
        "item": `${baseUrl}/${locale}/blog?category=${post.category.slug}`
      }] : []),
      {
        "@type": "ListItem",
        "position": post.category ? 4 : 3,
        "name": post.title,
        "item": `${baseUrl}/${locale}/blog/${post.slug}`
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
