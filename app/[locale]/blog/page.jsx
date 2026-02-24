// app/[locale]/blog/page.jsx
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogStructuredData from '@/components/StructuredData/BlogStructuredData';

// ============================================================================
// Metadata
// ============================================================================
export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const { category, tag, page } = await searchParams;
  const lang = locale.split('-')[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const title = lang === 'ar'
    ? 'المدونة | نصائح التوفير والعروض - كوبونات'
    : 'Blog | Saving Tips & Deals - Cobonat';
  const description = lang === 'ar'
    ? 'اكتشف أحدث نصائح التوفير، مقارنات المتاجر، وأفضل عروض السعودية من فريق كوبونات.'
    : 'Discover the latest saving tips, store comparisons, and best deals in Saudi Arabia from Cobonat team.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/blog`,
        'en-SA': `${baseUrl}/en-SA/blog`
      }
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/blog`,
      type: 'website'
    }
  };
}

// ============================================================================
// Data fetching helpers
// ============================================================================
async function getPosts({ locale, categorySlug, tagSlug, page, limit }) {
  const lang   = locale.split('-')[0];
  const offset = (page - 1) * limit;

  const where = {
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() }
  };

  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { tag: { slug: tagSlug } } };

  const [posts, total] = await Promise.all([
    prisma.BlogPost.findMany({
      where,
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
        tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } }
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      skip: offset,
      take: limit
    }),
    prisma.BlogPost.count({ where })
  ]);

  return { posts, total, pages: Math.ceil(total / limit) };
}

async function getCategories(lang) {
  return prisma.BlogCategory.findMany({
    include: {
      translations: { where: { locale: lang } },
      _count: { select: { posts: { where: { status: 'PUBLISHED' } } } }
    }
  });
}

// ============================================================================
// Page Component
// ============================================================================
const POSTS_PER_PAGE = 12;

export default async function BlogIndexPage({ params, searchParams }) {
  const { locale }   = await params;
  const { category, tag, page: pageParam } = await searchParams;
  const lang   = locale.split('-')[0];
  const isRTL  = lang === 'ar';
  const page   = Math.max(1, parseInt(pageParam || '1'));
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const [{ posts, total, pages }, categories] = await Promise.all([
    getPosts({ locale, categorySlug: category, tagSlug: tag, page, limit: POSTS_PER_PAGE }),
    getCategories(lang)
  ]);

  const labels = {
    blog:      lang === 'ar' ? 'المدونة'          : 'Blog',
    allPosts:  lang === 'ar' ? 'جميع المقالات'    : 'All Articles',
    noResults: lang === 'ar' ? 'لا توجد مقالات'  : 'No articles found',
    prev:      lang === 'ar' ? 'السابق'           : 'Previous',
    next:      lang === 'ar' ? 'التالي'           : 'Next',
    pageOf:    lang === 'ar' ? `صفحة ${page} من ${pages}` : `Page ${page} of ${pages}`
  };

  // Transform posts for display
  const transformedPosts = posts.map(post => {
    const t = post.translations[0] || {};
    return {
      id: post.id,
      slug: post.slug,
      featuredImage: post.featuredImage,
      isFeatured: post.isFeatured,
      publishedAt: post.publishedAt,
      title: t.title || '',
      excerpt: t.excerpt || '',
      author: post.author ? {
        name: lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
        avatar: post.author.avatar
      } : null,
      category: post.category ? {
        slug: post.category.slug,
        name: post.category.translations[0]?.name || post.category.slug,
        color: post.category.color
      } : null,
      tags: post.tags.map(pt => ({
        slug: pt.tag.slug,
        name: pt.tag.translations[0]?.name || pt.tag.slug
      }))
    };
  });

  return (
    <>
      <BlogStructuredData locale={locale} baseUrl={baseUrl} />

      <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        
        {/* ── Header ── */}
        <header style={{ marginBottom: 32, textAlign: isRTL ? 'right' : 'left' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>
            {labels.blog}
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            {total} {lang === 'ar' ? 'مقال' : 'articles'}
          </p>
        </header>

        {/* ── Category Filter Bar ── */}
        <nav
          aria-label={lang === 'ar' ? 'فلتر التصنيفات' : 'Category filter'}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 32,
            justifyContent: isRTL ? 'flex-end' : 'flex-start'
          }}
        >
          {/* "All" pill */}
          <Link
            href={`/${locale}/blog`}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              background: !category ? '#470ae2' : '#f0f0f0',
              color: !category ? '#fff' : '#555',
              transition: 'all 0.15s'
            }}
          >
            {labels.allPosts}
          </Link>

          {categories
            .filter(cat => cat._count.posts > 0)
            .map(cat => {
              const catName = cat.translations[0]?.name || cat.slug;
              const isActive = category === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/${locale}/blog?category=${cat.slug}`}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: isActive ? (cat.color || '#470ae2') : '#f0f0f0',
                    color: isActive ? '#fff' : '#555'
                  }}
                >
                  {catName} ({cat._count.posts})
                </Link>
              );
            })}
        </nav>

        {/* ── Active tag filter indicator ── */}
        {tag && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.875rem', color: '#555' }}>
              {lang === 'ar' ? 'الوسم:' : 'Tag:'}{' '}
              <strong>#{tag}</strong>
            </span>
            <Link
              href={`/${locale}/blog${category ? `?category=${category}` : ''}`}
              style={{ color: '#e53e3e', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              ✕ {lang === 'ar' ? 'إزالة' : 'Remove'}
            </Link>
          </div>
        )}

        {/* ── Posts Grid ── */}
        {transformedPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
            <p style={{ fontSize: '1.1rem' }}>{labels.noResults}</p>
            <Link href={`/${locale}/blog`} style={{ color: '#470ae2' }}>
              {labels.allPosts}
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 48
          }}>
            {transformedPosts.map(post => (
              <BlogCard key={post.id} post={post} locale={locale} variant="default" />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <nav
            aria-label={lang === 'ar' ? 'التنقل بين الصفحات' : 'Pagination'}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            {/* Prev */}
            {page > 1 && (
              <PaginationLink
                href={buildPageUrl(locale, category, tag, page - 1)}
                label={labels.prev}
                isRTL={isRTL}
              />
            )}

            {/* Page numbers */}
            {getPaginationRange(page, pages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '8px 4px', color: '#aaa' }}>…</span>
              ) : (
                <PaginationLink
                  key={p}
                  href={buildPageUrl(locale, category, tag, p)}
                  label={String(p)}
                  isActive={p === page}
                />
              )
            )}

            {/* Next */}
            {page < pages && (
              <PaginationLink
                href={buildPageUrl(locale, category, tag, page + 1)}
                label={labels.next}
                isRTL={isRTL}
              />
            )}
          </nav>
        )}
      </main>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPageUrl(locale, category, tag, page) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  if (page > 1) params.set('page', page);
  const qs = params.toString();
  return `/${locale}/blog${qs ? `?${qs}` : ''}`;
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

function PaginationLink({ href, label, isActive, isRTL }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        height: 40,
        padding: '0 12px',
        borderRadius: 8,
        fontSize: '0.875rem',
        fontWeight: isActive ? 700 : 400,
        textDecoration: 'none',
        background: isActive ? '#470ae2' : '#f5f5f5',
        color: isActive ? '#fff' : '#333',
        border: isActive ? 'none' : '1px solid #e5e5e5'
      }}
    >
      {label}
    </Link>
  );
}
