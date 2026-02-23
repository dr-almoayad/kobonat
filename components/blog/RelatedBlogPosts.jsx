// components/blog/RelatedBlogPosts.jsx
// Server Component — shown on store detail pages
// Ranking: explicit overrides > shared tags > shared category > latest
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BlogCard from './BlogCard';

// ============================================================================
// RANKING LOGIC
//
// Priority 1 (score 100): Explicit relatedPosts linked to a blog post that 
//   itself mentions this store's tags or storeId via relatedProducts
// Priority 2 (score 50):  Posts whose tags overlap with storeTagSlugs
// Priority 3 (score 25):  Posts in same category as store-related content
// Priority 4 (score 0):   Latest published posts (fallback)
//
// Deduplication: post.id tracked; never shows same post twice
// Exclusion: if currentPostSlug is given, that post is excluded
// ============================================================================

async function getRankedRelatedPosts({ storeId, storeTags = [], currentPostSlug = null, limit = 3, lang }) {
  const seenIds   = new Set();
  const result    = [];

  // ── 1. Posts with explicit store product link ────────────────────────────
  if (storeId) {
    const explicit = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        relatedProducts: { some: { productId: storeId } },
        ...(currentPostSlug ? { slug: { not: currentPostSlug } } : {})
      },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
        tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } }
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: limit
    });

    for (const post of explicit) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        result.push({ post, score: 100 });
      }
    }
  }

  // ── 2. Posts sharing tags with the store ────────────────────────────────
  if (result.length < limit && storeTags.length > 0) {
    const byTag = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        id: { notIn: [...seenIds] },
        tags: { some: { tag: { slug: { in: storeTags } } } },
        ...(currentPostSlug ? { slug: { not: currentPostSlug } } : {})
      },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
        tags: {
          include: { tag: { include: { translations: { where: { locale: lang } } } } }
        }
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: limit - result.length
    });

    for (const post of byTag) {
      // Score boost: +10 per matching tag
      const matchCount = post.tags.filter(pt => storeTags.includes(pt.tag.slug)).length;
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        result.push({ post, score: 50 + matchCount * 10 });
      }
    }
  }

  // ── 3. Fallback: latest posts ────────────────────────────────────────────
  if (result.length < limit) {
    const fallback = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        id: { notIn: [...seenIds] },
        ...(currentPostSlug ? { slug: { not: currentPostSlug } } : {})
      },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
        tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit - result.length
    });

    for (const post of fallback) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        result.push({ post, score: 0 });
      }
    }
  }

  // Sort by score descending, then return posts
  return result
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

// ============================================================================
// Transform for BlogCard
// ============================================================================
function transformPost(post, lang) {
  const t = post.translations[0] || {};
  return {
    id: post.id, slug: post.slug,
    featuredImage: post.featuredImage,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt,
    title:   t.title   || '',
    excerpt: t.excerpt || '',
    author: post.author ? {
      name:   lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
      avatar: post.author.avatar
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
//   locale          — 'ar-SA' | 'en-SA'
//   storeId         — store.id (integer) for product-link matching
//   storeTags       — string[] of tag slugs associated with the store
//   currentPostSlug — exclude this post (when rendering within a blog post)
//   limit           — max posts to show (default 3)
// ============================================================================
export default async function RelatedBlogPosts({
  locale,
  storeId = null,
  storeTags = [],
  currentPostSlug = null,
  limit = 3
}) {
  const lang  = locale.split('-')[0];
  const isRTL = lang === 'ar';

  const posts = await getRankedRelatedPosts({ storeId, storeTags, currentPostSlug, limit, lang });
  if (posts.length === 0) return null;

  const transformedPosts = posts.map(p => transformPost(p, lang));

  const heading = lang === 'ar' ? 'مقالات مفيدة' : 'Helpful Articles';
  const viewAll = lang === 'ar' ? 'المدونة' : 'View Blog';

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={heading}
      style={{ padding: '40px 0' }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          {heading}
        </h2>
        <Link
          href={`/${locale}/blog`}
          style={{ fontSize: '0.85rem', color: '#470ae2', textDecoration: 'none', fontWeight: 600 }}
        >
          {viewAll} {isRTL ? '←' : '→'}
        </Link>
      </div>

      {/* ── Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {transformedPosts.map(post => (
          <BlogCard key={post.id} post={post} locale={locale} variant="compact" />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// USAGE EXAMPLE (in app/[locale]/stores/[slug]/page.jsx):
//
//   import RelatedBlogPosts from '@/components/blog/RelatedBlogPosts';
//
//   // In the page component:
//   const storeTags = store.categories.map(sc => sc.category.slug); // use category slugs as tag seeds
//
//   <aside>
//     <RelatedBlogPosts
//       locale={locale}
//       storeId={store.id}
//       storeTags={storeTags}
//       limit={3}
//     />
//   </aside>
// ============================================================================
