// app/[locale]/blog/page.jsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogStructuredData from '@/components/StructuredData/BlogStructuredData';
import './blog.css';

// ============================================================================
// Metadata
// ============================================================================
export async function generateMetadata({ params, searchParams }) {
  const { locale }        = await params;
  const { category, tag } = await searchParams;
  const lang    = locale.split('-')[0];
  const isAr    = lang === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const buildUrl = (loc, extra = '') => `${baseUrl}/${loc}/blog${extra}`;
  const filterSuffix = category ? `?category=${category}` : tag ? `?tag=${tag}` : '';

  // Default copy (index view)
  let title = isAr
    ? 'المدونة | نصائح التوفير والعروض والمقارنات - كوبونات'
    : 'Blog | Saving Tips, Deals & Store Comparisons - Cobonat';
  let description = isAr
    ? 'اكتشف أحدث نصائح التوفير، مقارنات المتاجر، أفضل البطاقات البنكية، وأكواد الخصم في السعودية من فريق كوبونات.'
    : 'Discover the latest saving tips, store comparisons, credit card guides, and promo codes in Saudi Arabia from the Cobonat team.';
  let ogImage = `${baseUrl}/logo-512x512.png`;

  // Override for filtered views
  if (category || tag) {
    try {
      if (category) {
        const cat = await prisma.blogCategory.findUnique({
          where:   { slug: category },
          include: { translations: { where: { locale: lang } } },
        });
        const catName = cat?.translations[0]?.name || category;
        title       = isAr ? `${catName} | مدونة كوبونات` : `${catName} | Cobonat Blog`;
        description = isAr
          ? `مقالات وعروض حول ${catName} في السعودية - من مدونة كوبونات.`
          : `Articles and deals about ${catName} in Saudi Arabia - from the Cobonat Blog.`;
      } else if (tag) {
        const tagRec = await prisma.blogTag.findUnique({
          where:   { slug: tag },
          include: { translations: { where: { locale: lang } } },
        });
        const tagName = tagRec?.translations[0]?.name || tag;
        title       = isAr ? `${tagName}# | مدونة كوبونات` : `#${tagName} | Cobonat Blog`;
        description = isAr
          ? `كل المقالات الموسومة بـ ${tagName} في مدونة كوبونات.`
          : `All articles tagged with ${tagName} on the Cobonat Blog.`;
      }
    } catch { /* keep defaults */ }
  }

  // Use latest featured post image as og:image when available
  try {
    const latest = await prisma.blogPost.findFirst({
      where:   { status: 'PUBLISHED', isFeatured: true, featuredImage: { not: null } },
      orderBy: { publishedAt: 'desc' },
      select:  { featuredImage: true },
    });
    if (latest?.featuredImage) ogImage = latest.featuredImage;
  } catch { /* keep default */ }

  // Don't index paginated/filtered views — follow links only
  const robots = (category || tag)
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1';

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    robots,
    keywords: isAr
      ? 'مدونة كوبونات, نصائح التوفير, مقارنة متاجر, عروض السعودية, أكواد خصم, بطاقات بنكية'
      : 'Cobonat blog, saving tips, store comparisons, Saudi Arabia deals, promo codes, credit cards',
    icons: {
      icon:  [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    applicationName: isAr ? 'كوبونات' : 'Cobonat',
    alternates: {
      canonical:  buildUrl(locale, filterSuffix),
      languages: {
        'ar-SA':    buildUrl('ar-SA', filterSuffix),
        'en-SA':    buildUrl('en-SA', filterSuffix),
        'x-default': buildUrl('ar-SA'),
      },
    },
    openGraph: {
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      url:         buildUrl(locale, filterSuffix),
      type:        'website',
      locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      title,
      description,
      images:      [ogImage],
    },
  };
}

// ============================================================================
// Data helpers
// ============================================================================
async function getPosts({ locale, categorySlug, tagSlug, page, limit }) {
  const lang   = locale.split('-')[0];
  const offset = (page - 1) * limit;

  const where = { status: 'PUBLISHED' };
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug)      where.tags     = { some: { tag: { slug: tagSlug } } };

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: { where: { locale: lang } },
          author:   true,
          category: { include: { translations: { where: { locale: lang } } } },
          tags:     { include: { tag: { include: { translations: { where: { locale: lang } } } } } },
        },
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        skip:  offset,
        take:  limit,
      }),
      prisma.blogPost.count({ where }),
    ]);
    return { posts, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('[blog/page] getPosts error:', error.message);
    return { posts: [], total: 0, pages: 0 };
  }
}

async function getCategories(lang) {
  try {
    return await prisma.blogCategory.findMany({
      include: {
        translations: { where: { locale: lang } },
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
      },
    });
  } catch (error) {
    console.error('[blog/page] getCategories error:', error.message);
    return [];
  }
}

// ============================================================================
// Page
// ============================================================================
const POSTS_PER_PAGE = 12;

export default async function BlogIndexPage({ params, searchParams }) {
  const { locale }                         = await params;
  const { category, tag, page: pageParam } = await searchParams;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const page    = Math.max(1, parseInt(pageParam || '1'));
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const [{ posts, total, pages }, categories] = await Promise.all([
    getPosts({ locale, categorySlug: category, tagSlug: tag, page, limit: POSTS_PER_PAGE }),
    getCategories(lang),
  ]);

  const labels = {
    blog:      lang === 'ar' ? 'المدونة'        : 'Blog',
    allPosts:  lang === 'ar' ? 'جميع المقالات'  : 'All Articles',
    noResults: lang === 'ar' ? 'لا توجد مقالات' : 'No articles found',
    prev:      lang === 'ar' ? 'السابق'         : 'Previous',
    next:      lang === 'ar' ? 'التالي'         : 'Next',
    pageOf:    lang === 'ar' ? `صفحة ${page} من ${pages}` : `Page ${page} of ${pages}`,
  };

  const transformedPosts = posts.map(post => {
    const t = post.translations?.[0] || {};
    return {
      id:            post.id,
      slug:          post.slug,
      featuredImage: post.featuredImage,
      isFeatured:    post.isFeatured,
      publishedAt:   post.publishedAt,
      title:         t.title   || '',
      excerpt:       t.excerpt || '',
      author: post.author ? {
        name:   lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
        avatar: post.author.avatar,
      } : null,
      category: post.category ? {
        slug:  post.category.slug,
        name:  post.category.translations?.[0]?.name || post.category.slug,
        color: post.category.color,
      } : null,
      tags: (post.tags || []).map(pt => ({
        slug: pt.tag.slug,
        name: pt.tag.translations?.[0]?.name || pt.tag.slug,
      })),
    };
  }).filter(p => p.title);

  return (
    <>
      <BlogStructuredData
        locale={locale}
        baseUrl={baseUrl}
        posts={transformedPosts.slice(0, 6)}
        categories={categories}
      />

      <main dir={isRTL ? 'rtl' : 'ltr'} className="blog-index">

        <div className="blog-index__header">
          <h1 className="blog-index__title">{labels.blog}</h1>

          {categories.length > 0 && (
            <div className="blog-index__cats">
              <Link
                href={`/${locale}/blog`}
                className={`blog-index__cat${!category && !tag ? ' blog-index__cat--active' : ''}`}
              >
                {labels.allPosts}
              </Link>
              {categories.filter(c => c._count.posts > 0).map(cat => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/blog?category=${cat.slug}`}
                  className={`blog-index__cat${category === cat.slug ? ' blog-index__cat--active' : ''}`}
                  style={category === cat.slug ? { background: cat.color, borderColor: cat.color, color: '#fff' } : {}}
                >
                  {cat.translations?.[0]?.name || cat.slug}
                </Link>
              ))}
            </div>
          )}
        </div>

        {transformedPosts.length === 0 ? (
          <p className="blog-index__empty">{labels.noResults}</p>
        ) : (
          <div className="blog-index__grid">
            {transformedPosts.map(post => (
              <BlogCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="blog-index__pagination" aria-label="pagination">
            {page > 1 && (
              <Link
                href={`/${locale}/blog?page=${page - 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
                className="blog-index__page-btn"
              >
                {labels.prev}
              </Link>
            )}
            <span className="blog-index__page-info">{labels.pageOf}</span>
            {page < pages && (
              <Link
                href={`/${locale}/blog?page=${page + 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}`}
                className="blog-index__page-btn"
              >
                {labels.next}
              </Link>
            )}
          </nav>
        )}

      </main>
    </>
  );
}
