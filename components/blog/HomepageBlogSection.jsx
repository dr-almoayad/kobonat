// components/blog/HomepageBlogSection.jsx
// Server Component - fetches its own data
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BlogCard from './BlogCard';

// ============================================================================
// Fetch up to 3 featured posts; fill remaining from latest if needed
// ============================================================================
async function getFeaturedPosts(lang, count = 3) {
  try {
    // Step 1: Get featured posts
    const featured = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, isFeatured: true },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
        tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } }
      },
      orderBy: { publishedAt: 'desc' },
      take: count
    });

    // Step 2: Fill up with latest if we don't have enough
    if (featured.length < count) {
      const featuredIds = featured.map(p => p.id);
      const needed = count - featured.length;

      const latest = await prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          id: { notIn: featuredIds }
        },
        include: {
          translations: { where: { locale: lang } },
          author: true,
          category: { include: { translations: { where: { locale: lang } } } },
          tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } }
        },
        orderBy: { publishedAt: 'desc' },
        take: needed
      });

      return [...featured, ...latest];
    }

    return featured;
  } catch (error) {
    console.error('[HomepageBlogSection] fetch error:', error.message);
    return [];
  }
}

// ============================================================================
// Transform raw Prisma post to clean BlogCard-compatible shape
// ============================================================================
function transformPost(post, lang) {
  const t = post.translations[0] || {};
  return {
    id:           post.id,
    slug:         post.slug,
    featuredImage:post.featuredImage,
    isFeatured:   post.isFeatured,
    publishedAt:  post.publishedAt,
    title:        t.title   || '',
    excerpt:      t.excerpt || '',
    author: post.author ? {
      name:  lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
      avatar:post.author.avatar
    } : null,
    category: post.category ? {
      slug:  post.category.slug,
      name:  post.category.translations[0]?.name || post.category.slug,
      color: post.category.color
    } : null,
    tags: (post.tags || []).map(pt => ({
      slug: pt.tag.slug,
      name: pt.tag.translations[0]?.name || pt.tag.slug
    }))
  };
}

// ============================================================================
// Component
// Props:
//   locale  — 'ar-SA' | 'en-SA'
//   count   — how many posts to show (default 3)
// ============================================================================
export default async function HomepageBlogSection({ locale, count = 3 }) {
  const lang  = locale.split('-')[0];
  const isRTL = lang === 'ar';

  const posts = await getFeaturedPosts(lang, count);
  if (posts.length === 0) return null;

  const transformedPosts = posts.map(p => transformPost(p, lang));

  const labels = {
    heading: lang === 'ar' ? 'أحدث المقالات والنصائح'   : 'Latest Tips & Articles',
    sub:     lang === 'ar' ? 'نصائح توفير، مقارنات، وأفضل العروض من فريق كوبونات' : 'Saving tips, comparisons & best deals from the Cobonat team',
    cta:     lang === 'ar' ? 'عرض جميع المقالات'         : 'View All Articles'
  };

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={labels.heading}
      style={{ padding: '56px 16px', background: '#fafafa' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Section header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 800,
              color: '#1a1a1a',
              margin: '0 0 6px'
            }}>
              {labels.heading}
            </h2>
            <p style={{ color: '#777', fontSize: '0.9rem', margin: 0 }}>
              {labels.sub}
            </p>
          </div>

          <Link
            href={`/${locale}/blog`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 8,
              background: '#470ae2',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {labels.cta} {isRTL ? '←' : '→'}
          </Link>
        </div>

        {/* ── Posts grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24
        }}>
          {transformedPosts.map(post => (
            <BlogCard key={post.id} post={post} locale={locale} variant="featured" />
          ))}
        </div>

      </div>
    </section>
  );
}
