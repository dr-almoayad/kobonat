// app/[locale]/blog/[slug]/page.jsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogPostStructuredData from '@/components/StructuredData/BlogPostStructuredData';

// ============================================================================
// Static params for SSG (optional but good for performance)
// ============================================================================
// Allow on-demand rendering for posts not pre-generated at build time
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true }
    });
    // Generate for both locales
    return posts.flatMap(post => [
      { locale: 'ar-SA', slug: post.slug },
      { locale: 'en-SA', slug: post.slug }
    ]);
  } catch (error) {
    // Return empty array if the table doesn't exist yet (pre-migration build)
    // or if the DB is unreachable at build time
    console.warn('[blog/[slug]] generateStaticParams skipped:', error.message);
    return [];
  }
}

// ============================================================================
// Metadata
// ============================================================================
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const lang = locale.split('-')[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: { translations: { where: { locale: lang } } }
  });

  if (!post) return { title: 'Not Found' };

  const t = post.translations[0] || {};

  return {
    metadataBase: new URL(baseUrl),
icons: {
  icon: [
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
  ],
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
},
    title: t.metaTitle || t.title,
    description: t.metaDescription || t.excerpt,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog/${slug}`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/blog/${slug}`,
        'en-SA': `${baseUrl}/en-SA/blog/${slug}`
      }
    },
    openGraph: {
      siteName: lang === 'ar' ? 'كوبونات' : 'Cobonat',
      title: t.metaTitle || t.title,
      description: t.metaDescription || t.excerpt,
      url: `${baseUrl}/${locale}/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630 }] : []
    }
  };
}

// ============================================================================
// Fetch post with all relations
// ============================================================================
async function getPost(slug, lang) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      translations: { where: { locale: lang } },
      author: true,
      category: { include: { translations: { where: { locale: lang } } } },
      tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } },
      // Explicit related post overrides
      relatedPosts: {
        include: {
          relatedPost: {
            where: { status: 'PUBLISHED' },
            include: {
              translations: { where: { locale: lang } },
              author: true,
              category: { include: { translations: { where: { locale: lang } } } }
            }
          }
        },
        orderBy: { order: 'asc' },
        take: 3
      }
    }
  });

  return post;
}

// ============================================================================
// Page Component
// ============================================================================
export default async function BlogPostPage({ params }) {
  const { locale, slug } = await params;
  const lang = locale.split('-')[0];
  const isRTL = lang === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const post = await getPost(slug, lang);
  if (!post) notFound();

  const t = post.translations[0] || {};
  const authorName = lang === 'ar' ? (post.author?.nameAr || post.author?.name) : post.author?.name;

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })
        .format(new Date(post.publishedAt))
    : '';

  // ── Related posts (explicit overrides) ──
  const explicitRelated = post.relatedPosts
    .filter(rp => rp.relatedPost)
    .map(rp => {
      const rPost = rp.relatedPost;
      const rt = rPost.translations[0] || {};
      return {
        id: rPost.id, slug: rPost.slug, featuredImage: rPost.featuredImage,
        isFeatured: rPost.isFeatured, publishedAt: rPost.publishedAt,
        title: rt.title || '', excerpt: rt.excerpt || '',
        author: rPost.author ? {
          name: lang === 'ar' ? (rPost.author.nameAr || rPost.author.name) : rPost.author.name,
          avatar: rPost.author.avatar
        } : null,
        category: rPost.category ? {
          slug: rPost.category.slug,
          name: rPost.category.translations[0]?.name || rPost.category.slug,
          color: rPost.category.color
        } : null,
        tags: []
      };
    });

  // ── If no explicit related, fetch by tag/category ──
  let relatedPosts = explicitRelated;
  if (relatedPosts.length < 3) {
    const tagIds  = post.tags.map(pt => pt.tagId);
    const catId   = post.categoryId;
    const needed  = 3 - relatedPosts.length;
    const existingIds = [post.id, ...relatedPosts.map(r => r.id)];

    const fallback = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: existingIds },
        OR: [
          tagIds.length > 0 ? { tags: { some: { tagId: { in: tagIds } } } } : undefined,
          catId ? { categoryId: catId } : undefined
        ].filter(Boolean)
      },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } }
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: needed
    });

    relatedPosts = [...relatedPosts, ...fallback.map(rPost => {
      const rt = rPost.translations[0] || {};
      return {
        id: rPost.id, slug: rPost.slug, featuredImage: rPost.featuredImage,
        isFeatured: rPost.isFeatured, publishedAt: rPost.publishedAt,
        title: rt.title || '', excerpt: rt.excerpt || '',
        author: rPost.author ? {
          name: lang === 'ar' ? (rPost.author.nameAr || rPost.author.name) : rPost.author.name,
          avatar: rPost.author.avatar
        } : null,
        category: rPost.category ? {
          slug: rPost.category.slug,
          name: rPost.category.translations[0]?.name || rPost.category.slug,
          color: rPost.category.color
        } : null,
        tags: []
      };
    })];
  }

  const schemaPost = {
    slug: post.slug,
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    title: t.title, excerpt: t.excerpt, content: t.content,
    metaTitle: t.metaTitle, metaDescription: t.metaDescription,
    author: post.author,
    category: post.category
  };

  return (
    <>
      <BlogPostStructuredData post={schemaPost} locale={locale} baseUrl={baseUrl} />

      <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        
        {/* ── Breadcrumbs ── */}
        <nav aria-label="breadcrumb" style={{ marginBottom: 24, fontSize: '0.85rem', color: '#888' }}>
          <Link href={`/${locale}`} style={{ color: '#888', textDecoration: 'none' }}>
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          {' / '}
          <Link href={`/${locale}/blog`} style={{ color: '#888', textDecoration: 'none' }}>
            {lang === 'ar' ? 'المدونة' : 'Blog'}
          </Link>
          {post.category && (
            <>
              {' / '}
              <Link
                href={`/${locale}/blog?category=${post.category.slug}`}
                style={{ color: '#888', textDecoration: 'none' }}
              >
                {post.category.translations[0]?.name}
              </Link>
            </>
          )}
        </nav>

        {/* ── Category badge ── */}
        {post.category && (
          <Link
            href={`/${locale}/blog?category=${post.category.slug}`}
            style={{
              display: 'inline-block',
              background: (post.category.color || '#470ae2') + '18',
              color: post.category.color || '#470ae2',
              padding: '4px 12px', borderRadius: 20,
              fontSize: '0.8rem', fontWeight: 700,
              textDecoration: 'none', marginBottom: 16
            }}
          >
            {post.category.translations[0]?.name}
          </Link>
        )}

        {/* ── Title ── */}
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.3, margin: '0 0 16px' }}>
          {t.title}
        </h1>

        {/* ── Meta ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {post.author?.avatar && (
            <Image src={post.author.avatar} alt={authorName || ''} width={36} height={36}
              style={{ borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            {authorName && <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>{authorName}</p>}
            <time style={{ fontSize: '0.8rem', color: '#aaa' }}>{formattedDate}</time>
          </div>
        </div>

        {/* ── Featured image ── */}
        {post.featuredImage && (
          <div style={{ position: 'relative', width: '100%', paddingTop: '52%', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
            <Image
              src={post.featuredImage}
              alt={t.title || ''}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 800px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        {/* ── Content ── */}
        <div
          className="blog-content"
          style={{ lineHeight: 1.8, fontSize: '1.0625rem', color: '#333' }}
          dangerouslySetInnerHTML={{ __html: t.content || '' }}
        />

        {/* ── Tags ── */}
        {post.tags.length > 0 && (
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {post.tags.map(pt => (
              <Link
                key={pt.tag.slug}
                href={`/${locale}/blog?tag=${pt.tag.slug}`}
                style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: '#f5f5f5', color: '#555',
                  fontSize: '0.8rem', textDecoration: 'none',
                  border: '1px solid #e5e5e5'
                }}
              >
                #{pt.tag.translations[0]?.name || pt.tag.slug}
              </Link>
            ))}
          </div>
        )}

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <section style={{ marginTop: 64 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24, color: '#1a1a1a' }}>
              {lang === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {relatedPosts.map(rPost => (
                <BlogCard key={rPost.id} post={rPost} locale={locale} variant="default" />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
