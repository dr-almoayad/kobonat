// components/blog/HomepageBlogSection.jsx
// ✅ Fully corrected – now uses EmblaCarousel for horizontal scrolling.
// ✅ Handles both raw (Prisma) posts and pre‑transformed posts.
// ✅ Max-width: 1312px, increased vertical padding, taller cards.
 
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BlogCard from './BlogCard';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';

// ============================================================================
// Fetch up to `count` published posts; featured ones first, then latest.
// ============================================================================
async function getFeaturedPosts(lang, count = 8) {
  try {
    const baseWhere = { status: 'PUBLISHED' };
    const include = {
      translations: { where: { locale: lang } },
      author: true,
      category: { include: { translations: { where: { locale: lang } } } },
      tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } },
    };

    // Step 1: featured posts first
    const featured = await prisma.blogPost.findMany({
      where: { ...baseWhere, isFeatured: true },
      include,
      orderBy: { publishedAt: 'desc' },
      take: count,
    });

    if (featured.length >= count) return featured;

    // Step 2: fill remaining slots with latest non‑featured
    const featuredIds = featured.map(p => p.id);
    const latest = await prisma.blogPost.findMany({
      where: { ...baseWhere, id: { notIn: featuredIds.length ? featuredIds : [-1] } },
      include,
      orderBy: { publishedAt: 'desc' },
      take: count - featured.length,
    });

    return [...featured, ...latest];
  } catch (error) {
    console.error('[HomepageBlogSection] fetch error:', error.message);
    return [];
  }
}

// ============================================================================
// Transform raw Prisma post → BlogCard‑compatible shape
// ============================================================================
function transformPost(post, lang) {
  const t = post.translations?.[0] || {};
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
      avatar: post.author.avatar,
    } : null,
    category: post.category ? {
      slug: post.category.slug,
      name: post.category.translations?.[0]?.name || post.category.slug,
      color: post.category.color,
    } : null,
    tags: (post.tags || []).map(pt => ({
      slug: pt.tag.slug,
      name: pt.tag.translations?.[0]?.name || pt.tag.slug,
    })),
  };
}

// ============================================================================
// Component
// ============================================================================
export default async function HomepageBlogSection({
  posts: preFetchedPosts, // can be raw Prisma posts OR already transformed
  locale,
  count = 8,
}) {
  const lang = locale.split('-')[0];
  const isRTL = lang === 'ar';

  let posts = preFetchedPosts;

  // If no posts provided, fetch them
  if (!posts) {
    posts = await getFeaturedPosts(lang, count);
  }

  if (!posts?.length) return null;

  // ── ✅ Smart transform: if posts are already flat (have `title`), use them directly.
  // Otherwise, transform from Prisma raw shape.
  const isAlreadyTransformed = posts[0]?.title !== undefined;
  const transformedPosts = isAlreadyTransformed
    ? posts
    : posts.map(p => transformPost(p, lang));

  const labels = {
    heading: lang === 'ar' ? 'أحدث المقالات والنصائح' : 'Latest Tips & Articles',
    sub: lang === 'ar' ? 'نصائح توفير، مقارنات، وأفضل العروض من فريق كوبونات' : 'Saving tips, comparisons & best deals from the Cobonat team',
    cta: lang === 'ar' ? 'عرض جميع المقالات' : 'View All Articles',
  };

  const slideWidth = '300px';

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={labels.heading}
      style={{ padding: '64px 16px', background: '#fafafa' }}
    >
      <div style={{ maxWidth: 1312, margin: '0 auto' }}>

        {/* ── Section header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px' }}>
              {labels.heading}
            </h2>
            <p style={{ color: '#777', fontSize: '0.9rem', margin: 0 }}>{labels.sub}</p>
          </div>
          <Link
            href={`/${locale}/blog`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8, background: '#470ae2',
              color: '#fff', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            {labels.cta} {isRTL ? '←' : '→'}
          </Link>
        </div>

        {/* ── Carousel with vertical padding ── */}
        <div style={{ padding: '0.5rem 0' }}>
          <EmblaCarousel
            locale={locale}
            slideWidth={slideWidth}
            slideGap="1rem"
            freeScroll={true}
            scrollSlides={2}
          >
            {transformedPosts.map(post => (
              <div key={post.id} style={{ height: '100%', minHeight: '420px' }}>
                <BlogCard
                  post={post}
                  locale={locale}
                  variant="featured"
                />
              </div>
            ))}
          </EmblaCarousel>
        </div>

      </div>
    </section>
  );
}
