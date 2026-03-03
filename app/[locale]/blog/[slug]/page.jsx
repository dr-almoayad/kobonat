// app/[locale]/blog/[slug]/page.jsx
// Renders: featured image, author, category, tags, main content,
//          structured sections, linked stores sidebar, FAQ accordion, related posts.

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogPostStructuredData from '@/components/StructuredData/BlogPostStructuredData';
import RelatedPostsSidebar from '@/components/blog/RelatedPostsSidebar';

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

      // ── Structured sections ──────────────────────────────────────────
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

      // ── Post-level linked stores ─────────────────────────────────────
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

      // ── Editorial related posts ──────────────────────────────────────
      // NOTE: `where` is NOT allowed inside `include` for to-one relations in Prisma.
      // Status filtering is done in JavaScript below instead.
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
  // FIX: `where` on to-one relations crashes Prisma — status checked in JS here.
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
    const fallback = await prisma.blogPost.findMany({
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

  // FAQ items for in-page accordion
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

      <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Breadcrumbs ──────────────────────────────────────────────── */}
        <nav aria-label="breadcrumb" style={{ marginBottom: 24, fontSize: '0.82rem', color: '#888', display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href={`/${locale}`}      style={{ color: '#888', textDecoration: 'none' }}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link href={`/${locale}/blog`} style={{ color: '#888', textDecoration: 'none' }}>{lang === 'ar' ? 'المدونة' : 'Blog'}</Link>
          {post.category && (
            <>
              <span>/</span>
              <Link href={`/${locale}/blog?category=${post.category.slug}`} style={{ color: '#888', textDecoration: 'none' }}>
                {post.category.translations[0]?.name || post.category.slug}
              </Link>
            </>
          )}
        </nav>

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: hasSidebar ? '1fr 300px' : '1fr',
          gap:                 48,
          alignItems:          'start',
        }}>

          {/* ── ARTICLE ──────────────────────────────────────────────── */}
          <article>

            {/* Category badge + meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              {post.category && (
                <Link href={`/${locale}/blog?category=${post.category.slug}`}
                  style={{ padding: '3px 12px', borderRadius: 20, background: post.category.color || '#470ae2', color: '#fff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                  {post.category.translations[0]?.name || post.category.slug}
                </Link>
              )}
              {formattedDate && (
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{formattedDate}</span>
              )}
              {authorName && (
                <span style={{ fontSize: '0.8rem', color: '#888' }}>· {authorName}</span>
              )}
              {post.readingTime && (
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  · {lang === 'ar' ? `${post.readingTime} دقائق قراءة` : `${post.readingTime} min read`}
                </span>
              )}
              {post.contentType && post.contentType !== 'GUIDE' && (
                <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem' }}>{post.contentType}</span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, lineHeight: 1.25, color: '#1a1a1a', marginBottom: 24 }}>
              {t.title}
            </h1>

            {/* Featured image */}
            {post.featuredImage && (
              <div style={{ marginBottom: 32, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
                <Image src={post.featuredImage} alt={t.title || ''} fill style={{ objectFit: 'cover' }} priority sizes="(max-width: 768px) 100vw, 800px" />
              </div>
            )}

            {/* Excerpt (lead) */}
            {t.excerpt && (
              <p style={{ fontSize: '1.1rem', color: '#444', lineHeight: 1.7, marginBottom: 28, borderLeft: isRTL ? 'none' : '4px solid #470ae2', borderRight: isRTL ? '4px solid #470ae2' : 'none', paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 }}>
                {t.excerpt}
              </p>
            )}

            {/* Main article content */}
            <div
              className="blog-content"
              style={{ lineHeight: 1.85, fontSize: '1.0625rem', color: '#333' }}
              dangerouslySetInnerHTML={{ __html: t.content || '' }}
            />

            {/* ── Structured sections ──────────────────────────────── */}
            {post.sections?.length > 0 && (
              <div style={{ marginTop: 40 }}>
                {post.sections.map(section => {
                  const st = section.translations?.[0] || {};
                  return (
                    <div key={section.id} style={{ marginBottom: 40 }}>
                      {st.subtitle && (
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{st.subtitle}</h2>
                      )}
                      {section.image && (
                        <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 20, aspectRatio: '16/9', position: 'relative' }}>
                          <Image src={section.image} alt={st.subtitle || ''} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 800px" />
                        </div>
                      )}
                      {st.content && (
                        <div className="blog-content" style={{ lineHeight: 1.85, color: '#333' }} dangerouslySetInnerHTML={{ __html: st.content }} />
                      )}

                      {/* Section-level product cards */}
                      {section.products?.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
                          {section.products.map(sp => {
                            const pt = sp.product?.translations?.[0] || {};
                            return (
                              <a key={sp.productId} href={sp.product?.productUrl || '#'} target="_blank" rel="nofollow noopener"
                                style={{ display: 'block', border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', textDecoration: 'none', color: '#333' }}>
                                {sp.product?.image && (
                                  <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                                    <Image src={sp.product.image} alt={pt.title || ''} fill style={{ objectFit: 'cover' }} sizes="200px" />
                                  </div>
                                )}
                                <div style={{ padding: '10px 12px' }}>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{pt.title}</p>
                                  {sp.product?.discountValue && (
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#e11d48', fontWeight: 700 }}>
                                      -{sp.product.discountValue}{sp.product.discountType === 'PERCENTAGE' ? '%' : ' SAR'}
                                    </p>
                                  )}
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Section-level store chips */}
                      {section.stores?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                          {section.stores.map(ss => {
                            const st2 = ss.store?.translations?.[0] || {};
                            return (
                              <Link key={ss.storeId} href={`/${locale}/stores/${st2.slug || ss.storeId}`}
                                style={{ padding: '5px 14px', borderRadius: 20, background: '#f8f8f8', border: '1px solid #e5e5e5', fontSize: '0.8rem', textDecoration: 'none', color: '#333', fontWeight: 500 }}>
                                {st2.name || `Store #${ss.storeId}`}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── FAQ accordion ────────────────────────────────────── */}
            {faqItems.length > 0 && (
              <section style={{ marginTop: 48 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 20, color: '#1a1a1a' }}>
                  {lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                </h2>
                {faqItems.map((item, i) => (
                  <details key={i} style={{ borderBottom: '1px solid #e5e5e5', padding: '16px 0' }} open={i === 0}>
                    <summary style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: '#1a1a1a', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                      {item.q}
                      <span style={{ color: '#888', fontWeight: 400 }}>+</span>
                    </summary>
                    <p style={{ margin: '12px 0 0', color: '#555', lineHeight: 1.7 }}>{item.a}</p>
                  </details>
                ))}
              </section>
            )}

            {/* ── Tags ─────────────────────────────────────────────── */}
            {post.tags.length > 0 && (
              <div style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {post.tags.map(pt => (
                  <Link key={pt.tag.slug} href={`/${locale}/blog?tag=${pt.tag.slug}`}
                    style={{ padding: '4px 14px', borderRadius: 20, background: '#f5f5f5', color: '#555', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #e5e5e5' }}>
                    #{pt.tag.translations[0]?.name || pt.tag.slug}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Author bio ────────────────────────────────────────── */}
            {post.author && authorBio && (
              <div style={{ marginTop: 48, padding: '24px', background: '#f8f8f8', borderRadius: 12, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {post.author.avatar && (
                  <Image src={post.author.avatar} alt={authorName} width={56} height={56} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1a1a1a' }}>{authorName}</p>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', lineHeight: 1.6 }}>{authorBio}</p>
                </div>
              </div>
            )}
          </article>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────── */}
          {hasSidebar && (
            <aside style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* Linked Stores widget */}
              {hasLinkedStores && (
                <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lang === 'ar' ? 'المتاجر في هذا المقال' : 'Stores in this article'}
                  </h3>
                  {post.linkedStores.map(ls => {
                    const st = ls.store?.translations?.[0] || {};
                    const activeVouchers = ls.store?._count?.vouchers ?? 0;
                    return (
                      <Link key={ls.storeId} href={`/${locale}/stores/${st.slug || ls.storeId}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{st.name || `Store #${ls.storeId}`}</span>
                        {activeVouchers > 0 && (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>
                            {activeVouchers} {lang === 'ar' ? 'كود' : 'codes'}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Related Posts — styled to match screenshot layout */}
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
