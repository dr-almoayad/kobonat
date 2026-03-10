// app/[locale]/blog/[slug]/page.jsx
// Renders: featured image, author, category, tags, main content,
//          structured sections, linked stores sidebar, FAQ accordion, related posts.

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BlogPostStructuredData from '@/components/StructuredData/BlogPostStructuredData';
import RelatedPostsSidebar from '@/components/blog/RelatedPostsSidebar';
import './BlogPost.css';

export const dynamicParams = true;

// ─────────────────────────────────────────────────────────────────────────────
// Static params (SSG)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where:  { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return posts.flatMap(post => [
      { locale: 'ar-SA', slug: post.slug },
      { locale: 'en-SA', slug: post.slug },
    ]);
  } catch (error) {
    console.warn('[blog/[slug]] generateStaticParams skipped:', error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const lang    = locale.split('-')[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const post = await prisma.blogPost.findUnique({
    where:   { slug, status: 'PUBLISHED' },
    include: { translations: { where: { locale: lang } } },
  });
  if (!post) return { title: 'Not Found' };

  const t = post.translations[0] || {};
  return {
    metadataBase: new URL(baseUrl),
    title:        t.metaTitle || t.title,
    description:  t.metaDescription || t.excerpt,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog/${slug}`,
      languages: {
        'ar-SA': `${baseUrl}/ar-SA/blog/${slug}`,
        'en-SA': `${baseUrl}/en-SA/blog/${slug}`,
      },
    },
    openGraph: {
      siteName:      lang === 'ar' ? 'كوبونات' : 'Cobonat',
      title:         t.metaTitle || t.title,
      description:   t.metaDescription || t.excerpt,
      url:           `${baseUrl}/${locale}/blog/${slug}`,
      type:          'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime:  post.updatedAt?.toISOString(),
      images:        post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630 }] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full post fetch
// ─────────────────────────────────────────────────────────────────────────────
async function getPost(slug, lang) {
  return prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      translations: { where: { locale: lang } },
      author: true,
      category: { include: { translations: { where: { locale: lang } } } },
      primaryStore: {
        include: { translations: { where: { locale: lang }, select: { name: true, slug: true } } },
      },
      tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          products: {
            orderBy: { order: 'asc' },
            include: {
              product: {
                include: {
                  translations: { where: { locale: lang } },
                  store: {
                    include: { translations: { where: { locale: lang }, select: { name: true, slug: true } } },
                  },
                },
              },
            },
          },
          stores: {
            orderBy: { order: 'asc' },
            include: {
              store: {
                include: { translations: { where: { locale: lang }, select: { name: true, slug: true } } },
              },
            },
          },
        },
      },
      linkedStores: {
        orderBy: { order: 'asc' },
        include: {
          store: {
            include: {
              translations: { where: { locale: lang }, select: { name: true, slug: true } },
              _count: { select: { vouchers: { where: { expiryDate: { gte: new Date() } } } } },
            },
          },
        },
      },
      relatedPosts: {
        orderBy: { order: 'asc' },
        take:    4,
        include: {
          relatedPost: {
            include: {
              translations: { where: { locale: lang } },
              author: true,
              category: { include: { translations: { where: { locale: lang } } } },
            },
          },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }) {
  const { locale, slug } = await params;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

  const post = await getPost(slug, lang);
  if (!post) notFound();

  const t          = post.translations[0] || {};
  const authorName = lang === 'ar' ? (post.author?.nameAr || post.author?.name) : post.author?.name;
  const authorBio  = lang === 'ar' ? (post.author?.bioAr  || post.author?.bio)  : post.author?.bio;

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(post.publishedAt))
    : '';

  // ── Related posts ────────────────────────────────────────────────────────
  const explicitRelated = post.relatedPosts
    .filter(rp => rp.relatedPost && rp.relatedPost.status === 'PUBLISHED')
    .map(rp => {
      const rPost = rp.relatedPost;
      const rt    = rPost.translations[0] || {};
      return {
        id: rPost.id, slug: rPost.slug, featuredImage: rPost.featuredImage,
        isFeatured: rPost.isFeatured, publishedAt: rPost.publishedAt,
        title: rt.title || '', excerpt: rt.excerpt || '',
        author:   rPost.author ? { name: lang === 'ar' ? (rPost.author.nameAr || rPost.author.name) : rPost.author.name, avatar: rPost.author.avatar } : null,
        category: rPost.category ? { slug: rPost.category.slug, name: rPost.category.translations[0]?.name || rPost.category.slug, color: rPost.category.color } : null,
        tags: [],
      };
    });

  let relatedPosts = explicitRelated;
  if (relatedPosts.length < 4) {
    const tagIds      = post.tags.map(pt => pt.tagId);
    const catId       = post.categoryId;
    const needed      = 4 - relatedPosts.length;
    const existingIds = [post.id, ...relatedPosts.map(r => r.id)];
    const fallback    = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: existingIds },
        OR: [
          tagIds.length > 0 ? { tags: { some: { tagId: { in: tagIds } } } } : undefined,
          catId ? { categoryId: catId } : undefined,
        ].filter(Boolean),
      },
      include: {
        translations: { where: { locale: lang } },
        author: true,
        category: { include: { translations: { where: { locale: lang } } } },
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: needed,
    });
    relatedPosts = [
      ...relatedPosts,
      ...fallback.map(rp => {
        const rt = rp.translations[0] || {};
        return {
          id: rp.id, slug: rp.slug, featuredImage: rp.featuredImage,
          isFeatured: rp.isFeatured, publishedAt: rp.publishedAt,
          title: rt.title || '', excerpt: rt.excerpt || '',
          author:   rp.author   ? { name: lang === 'ar' ? (rp.author.nameAr || rp.author.name) : rp.author.name, avatar: rp.author.avatar } : null,
          category: rp.category ? { slug: rp.category.slug, name: rp.category.translations[0]?.name || rp.category.slug, color: rp.category.color } : null,
          tags: [],
        };
      }),
    ];
  }

  // FAQ items
  let faqItems = [];
  if (post.faqJson) {
    try { faqItems = JSON.parse(post.faqJson); } catch { faqItems = []; }
  }

  const schemaPost = {
    slug: post.slug, featuredImage: post.featuredImage,
    publishedAt: post.publishedAt, updatedAt: post.updatedAt,
    readingTime: post.readingTime, faqJson: post.faqJson,
    title: t.title, excerpt: t.excerpt, content: t.content,
    metaTitle: t.metaTitle, metaDescription: t.metaDescription,
    author: post.author, category: post.category,
  };

  const hasLinkedStores = post.linkedStores?.length > 0;
  const hasRelated      = relatedPosts.length > 0;
  const hasSidebar      = hasLinkedStores || hasRelated;

  return (
    <>
      <BlogPostStructuredData post={schemaPost} locale={locale} baseUrl={baseUrl} />

      <main dir={isRTL ? 'rtl' : 'ltr'} className="bp-main">

        {/* ── Breadcrumbs ── */}
        <nav className="bp-breadcrumb" aria-label="breadcrumb">
          <Link href={`/${locale}`}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span className="bp-breadcrumb__sep">/</span>
          <Link href={`/${locale}/blog`}>{lang === 'ar' ? 'المدونة' : 'Blog'}</Link>
          {post.category && (
            <>
              <span className="bp-breadcrumb__sep">/</span>
              <Link href={`/${locale}/blog?category=${post.category.slug}`}>
                {post.category.translations[0]?.name || post.category.slug}
              </Link>
            </>
          )}
        </nav>

        {/* ── Two-column layout ── */}
        <div className={`bp-layout${hasSidebar ? ' bp-layout--with-sidebar' : ''}`}>

          {/* ── ARTICLE ── */}
          <article className="bp-article">

            {/* Meta row: category + date + author + reading time */}
            <div className="bp-meta">
              {post.category && (
                <Link
                  href={`/${locale}/blog?category=${post.category.slug}`}
                  className="bp-category-badge"
                  style={{ background: post.category.color || 'var(--bp-accent)' }}
                >
                  {post.category.translations[0]?.name || post.category.slug}
                </Link>
              )}
              {formattedDate && (
                <span className="bp-meta__item">{formattedDate}</span>
              )}
              {authorName && (
                <>
                  <span className="bp-meta__sep">·</span>
                  <span className="bp-meta__item">{authorName}</span>
                </>
              )}
              {post.readingTime && (
                <>
                  <span className="bp-meta__sep">·</span>
                  <span className="bp-meta__item">
                    {lang === 'ar' ? `${post.readingTime} دقائق قراءة` : `${post.readingTime} min read`}
                  </span>
                </>
              )}
              {post.contentType && post.contentType !== 'GUIDE' && (
                <span className="bp-content-type-badge">{post.contentType}</span>
              )}
            </div>

            {/* H1 */}
            <h1 className="bp-title">{t.title}</h1>

            {/* Featured image */}
            {post.featuredImage && (
              <div className="bp-cover">
                <Image
                  src={post.featuredImage}
                  alt={t.title || ''}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 760px"
                />
              </div>
            )}

            {/* Lead / excerpt */}
            {t.excerpt && (
              <p className="bp-excerpt">{t.excerpt}</p>
            )}

            {/* Main content */}
            {t.content && (
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: t.content }}
              />
            )}

            {/* ── Structured sections ── */}
            {post.sections?.length > 0 && (
              <div className="bp-sections">
                {post.sections.map(section => {
                  const st = section.translations?.[0] || {};
                  return (
                    <section key={section.id} className="bp-section">

                      {st.subtitle && (
                        <h2 className="bp-section__title">{st.subtitle}</h2>
                      )}

                      {section.image && (
                        <div className="bp-section__image">
                          <Image
                            src={section.image}
                            alt={st.subtitle || ''}
                            fill
                            sizes="(max-width: 768px) 100vw, 760px"
                          />
                        </div>
                      )}

                      {st.content && (
                        <div
                          className="blog-content"
                          dangerouslySetInnerHTML={{ __html: st.content }}
                        />
                      )}

                      {/* Product cards */}
                      {section.products?.length > 0 && (
                        <div className="bp-product-grid">
                          {section.products.map(sp => {
                            const pt = sp.product?.translations?.[0] || {};
                            return (
                              <a
                                key={sp.productId}
                                href={sp.product?.productUrl || '#'}
                                target="_blank"
                                rel="nofollow noopener"
                                className="bp-product-card"
                              >
                                {sp.product?.image && (
                                  <div className="bp-product-card__image">
                                    <Image src={sp.product.image} alt={pt.title || ''} fill sizes="200px" />
                                  </div>
                                )}
                                <div className="bp-product-card__body">
                                  <p className="bp-product-card__name">{pt.title}</p>
                                  {sp.product?.discountValue && (
                                    <p className="bp-product-card__discount">
                                      -{sp.product.discountValue}{sp.product.discountType === 'PERCENTAGE' ? '%' : ' SAR'}
                                    </p>
                                  )}
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Store chips */}
                      {section.stores?.length > 0 && (
                        <div className="bp-store-chips">
                          {section.stores.map(ss => {
                            const st2 = ss.store?.translations?.[0] || {};
                            return (
                              <Link
                                key={ss.storeId}
                                href={`/${locale}/stores/${st2.slug || ss.storeId}`}
                                className="bp-store-chip"
                              >
                                {st2.name || `Store #${ss.storeId}`}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                    </section>
                  );
                })}
              </div>
            )}

            {/* ── FAQ accordion ── */}
            {faqItems.length > 0 && (
              <section className="bp-faq">
                <h2 className="bp-faq__title">
                  {lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                </h2>
                {faqItems.map((item, i) => (
                  <details key={i} className="bp-faq__item" open={i === 0}>
                    <summary>
                      {item.q}
                      <span className="bp-faq__icon" aria-hidden="true">
                        {/* CSS handles + → − via [open] state in parent */}
                        +
                      </span>
                    </summary>
                    <p className="bp-faq__answer">{item.a}</p>
                  </details>
                ))}
              </section>
            )}

            {/* ── Tags ── */}
            {post.tags.length > 0 && (
              <div className="bp-tags">
                {post.tags.map(pt => (
                  <Link
                    key={pt.tag.slug}
                    href={`/${locale}/blog?tag=${pt.tag.slug}`}
                    className="bp-tag"
                  >
                    #{pt.tag.translations[0]?.name || pt.tag.slug}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Author bio ── */}
            {post.author && authorBio && (
              <div className="bp-author">
                {post.author.avatar && (
                  <Image
                    src={post.author.avatar}
                    alt={authorName || ''}
                    width={52}
                    height={52}
                    className="bp-author__avatar"
                  />
                )}
                <div>
                  <p className="bp-author__name">{authorName}</p>
                  <p className="bp-author__bio">{authorBio}</p>
                </div>
              </div>
            )}

          </article>

          {/* ── SIDEBAR ── */}
          {hasSidebar && (
            <aside className="bp-sidebar">

              {/* Linked stores */}
              {hasLinkedStores && (
                <div className="bp-stores-widget">
                  <div className="bp-stores-widget__header">
                    <h3 className="bp-stores-widget__title">
                      {lang === 'ar' ? 'المتاجر في هذا المقال' : 'Stores in this article'}
                    </h3>
                  </div>
                  {post.linkedStores.map(ls => {
                    const st             = ls.store?.translations?.[0] || {};
                    const activeVouchers = ls.store?._count?.vouchers ?? 0;
                    return (
                      <Link
                        key={ls.storeId}
                        href={`/${locale}/stores/${st.slug || ls.storeId}`}
                        className="bp-store-row"
                      >
                        <span className="bp-store-row__name">
                          {st.name || `Store #${ls.storeId}`}
                        </span>
                        {activeVouchers > 0 && (
                          <span className="bp-store-row__badge">
                            {activeVouchers} {lang === 'ar' ? 'كود' : 'codes'}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Related posts sidebar */}
              {hasRelated && (
                <RelatedPostsSidebar posts={relatedPosts} locale={locale} />
              )}

            </aside>
          )}

        </div>
      </main>
    </>
  );
}
