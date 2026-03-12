// app/[locale]/blog/[slug]/page.jsx
// Renders blog post content as an ordered list of blocks:
//   SECTION  → text + optional image + products + store chips
//   TABLE    → ComparisonTable component
//   EMBED    → EmbeddedPostCard component
// Blocks without a blockLayout entry are appended in creation order (back-compat).

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BlogPostStructuredData from '@/components/StructuredData/BlogPostStructuredData';
import RelatedPostsSidebar from '@/components/blog/RelatedPostsSidebar';
import StoreCard from '@/components/StoreCard/StoreCard';
import ComparisonTable from '@/components/blog/ComparisonTable/ComparisonTable';
import EmbeddedPostCard from '@/components/blog/EmbeddedPostCard/EmbeddedPostCard';
import SectionBlockRenderer from '@/components/blog/SectionBlockRenderer/SectionBlockRenderer';
import './BlogPost.css';

export const revalidate = 60;
export const dynamicParams = true;

// ─────────────────────────────────────────────────────────────────────────────
// Static params
// ─────────────────────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where:  { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return posts.flatMap(p => [
      { locale: 'ar-SA', slug: p.slug },
      { locale: 'en-SA', slug: p.slug },
    ]);
  } catch (err) {
    console.warn('[blog/[slug]] generateStaticParams skipped:', err.message);
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
// Data fetch
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

      // Sections
      sections: {
        orderBy: { order: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          products: {
            orderBy: { order: 'asc' },
            include: {
              product: {
                include: { translations: { where: { locale: lang } } },
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
          // Rich embeddable blocks with ordering
          sectionBlocks: {
            orderBy: { order: 'asc' },
            include: {
              post: {
                include: {
                  translations:  { where: { locale: lang } },
                  author:        true,
                  category:      { include: { translations: { where: { locale: lang } } } },
                  coverImage:    true,
                },
              },
              table: {
                include: {
                  translations: true,
                  columns: {
                    orderBy: { order: 'asc' },
                    include: {
                      translations: true,
                      cells: true,
                      store:    { include: { translations: true } },
                      bank:     { include: { translations: true } },
                      bankCard: { include: { translations: true } },
                    },
                  },
                  rows: {
                    orderBy: { order: 'asc' },
                    include: { translations: true, cells: true },
                  },
                },
              },
              product: { include: { translations: { where: { locale: lang } } } },
              store:   { include: { translations: true } },
              bank:    { include: { translations: true } },
              card:    {
                include: {
                  translations: true,
                  bank: { include: { translations: true } },
                },
              },
            },
          },
        },
      },

      // Comparison tables
      comparisonTables: {
        include: { translations: true }, // load all locales — ComparisonTable picks the right one
        orderBy: { id: 'asc' },
      },

      // Embedded post cards
      embeddedCards: {
        include: {
          embeddedPost: {
            include: {
              translations: { where: { locale: lang } },
              author: true,
              category: { include: { translations: { where: { locale: lang } } } },
            },
          },
        },
        orderBy: { id: 'asc' },
      },

      // Sidebar: linked stores
      linkedStores: {
        orderBy: { order: 'asc' },
        include: {
          store: {
            include: {
              translations: {
                where:  { locale: lang },
                select: { name: true, slug: true, showOffer: true },
              },
              _count: {
                select: { vouchers: { where: { expiryDate: { gte: new Date() } } } },
              },
            },
          },
        },
      },

      // Sidebar: related posts
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
// Block ordering
// Merges blockLayout (if present) with all known blocks.
// Blocks missing from the layout are appended at the end.
// ─────────────────────────────────────────────────────────────────────────────
function buildOrderedBlocks(post) {
  const allSections = post.sections   || [];
  const allTables   = post.comparisonTables || [];
  const allEmbeds   = post.embeddedCards    || [];

  let layout = [];
  if (post.blockLayout) {
    try { layout = JSON.parse(post.blockLayout); } catch {}
  }

  if (!layout.length) {
    // No layout — original order: sections → tables → embeds
    return [
      ...allSections.map(s => ({ type: 'SECTION', id: s.id, data: s })),
      ...allTables.map(t => ({ type: 'TABLE',   id: t.id, data: t })),
      ...allEmbeds.map(e => ({ type: 'EMBED',   id: e.id, data: e })),
    ];
  }

  // Map all items by type+id for quick lookup
  const sectionMap = Object.fromEntries(allSections.map(s => [s.id, s]));
  const tableMap   = Object.fromEntries(allTables.map(t => [t.id, t]));
  const embedMap   = Object.fromEntries(allEmbeds.map(e => [e.id, e]));

  const used = { SECTION: new Set(), TABLE: new Set(), EMBED: new Set() };
  const ordered = [];

  for (const block of layout) {
    const { type, id } = block;
    if (type === 'SECTION' && sectionMap[id]) {
      ordered.push({ type, id, data: sectionMap[id] });
      used.SECTION.add(id);
    } else if (type === 'TABLE' && tableMap[id]) {
      ordered.push({ type, id, data: tableMap[id] });
      used.TABLE.add(id);
    } else if (type === 'EMBED' && embedMap[id]) {
      ordered.push({ type, id, data: embedMap[id] });
      used.EMBED.add(id);
    }
  }

  // Append anything not referenced in the layout
  allSections.filter(s => !used.SECTION.has(s.id)).forEach(s =>
    ordered.push({ type: 'SECTION', id: s.id, data: s })
  );
  allTables.filter(t => !used.TABLE.has(t.id)).forEach(t =>
    ordered.push({ type: 'TABLE', id: t.id, data: t })
  );
  allEmbeds.filter(e => !used.EMBED.has(e.id)).forEach(e =>
    ordered.push({ type: 'EMBED', id: e.id, data: e })
  );

  return ordered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store card transform
// ─────────────────────────────────────────────────────────────────────────────
function transformStore(ls) {
  const st = ls.store;
  return {
    name:         st.translations?.[0]?.name  || '',
    slug:         st.translations?.[0]?.slug  || String(st.id),
    bigLogo:      st.bigLogo || null,
    logo:         st.logo    || null,
    color:        st.color   || '#470ae2',
    translations: st.translations || [],
    _count:       st._count || { vouchers: 0 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section renderer (extracted to keep JSX clean)
// ─────────────────────────────────────────────────────────────────────────────
function SectionBlock({ section, locale }) {
  const lang = locale.split('-')[0];
  const st   = section.translations?.[0] || {};

  // If the section has rich blocks, use them exclusively for body content.
  // Legacy content fields (content HTML, products, stores) are rendered as
  // fallback when no blocks exist (backwards compatibility).
  const hasBlocks = section.sectionBlocks?.length > 0;

  return (
    <section className="bp-section">
      {st.subtitle && <h2 className="bp-section__title">{st.subtitle}</h2>}

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

      {hasBlocks ? (
        /* ── Rich block content (new) ─────────────────────────────────── */
        <div className="bp-section-blocks">
          {section.sectionBlocks.map(block => (
            <SectionBlockRenderer key={block.id} block={block} locale={locale} />
          ))}
        </div>
      ) : (
        /* ── Legacy flat content (backwards compat) ───────────────────── */
        <>
          {st.content && (
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: st.content }} />
          )}

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
                          -{sp.product.discountValue}
                          {sp.product.discountType === 'PERCENTAGE' ? '%' : ' SAR'}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

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
        </>
      )}
    </section>
  );
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

  // ── Related posts fallback ──────────────────────────────────────────────
  const explicitRelated = (post.relatedPosts || [])
    .filter(rp => rp.relatedPost?.status === 'PUBLISHED')
    .map(rp => {
      const rp2 = rp.relatedPost;
      const rt  = rp2.translations[0] || {};
      return {
        id: rp2.id, slug: rp2.slug, featuredImage: rp2.featuredImage,
        isFeatured: rp2.isFeatured, publishedAt: rp2.publishedAt,
        title: rt.title || '', excerpt: rt.excerpt || '',
        author:   rp2.author   ? { name: lang === 'ar' ? (rp2.author.nameAr || rp2.author.name) : rp2.author.name, avatar: rp2.author.avatar } : null,
        category: rp2.category ? { slug: rp2.category.slug, name: rp2.category.translations[0]?.name || rp2.category.slug, color: rp2.category.color } : null,
        tags: [],
      };
    });

  let relatedPosts = explicitRelated;

  if (relatedPosts.length < 4) {
    const tagIds      = (post.tags || []).map(pt => pt.tagId);
    const catId       = post.categoryId;
    const existingIds = [post.id, ...relatedPosts.map(r => r.id)];
    const orConds     = [
      tagIds.length > 0 ? { tags: { some: { tagId: { in: tagIds } } } } : null,
      catId             ? { categoryId: catId }                          : null,
    ].filter(Boolean);

    if (orConds.length > 0) {
      try {
        const fallback = await prisma.blogPost.findMany({
          where: {
            status: 'PUBLISHED',
            id:     { notIn: existingIds.length ? existingIds : [0] },
            OR:     orConds,
          },
          include: {
            translations: { where: { locale: lang } },
            author: true,
            category: { include: { translations: { where: { locale: lang } } } },
          },
          orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
          take: 4 - relatedPosts.length,
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
      } catch (err) {
        console.error('[BlogPostPage] related fallback failed:', err.message);
      }
    }
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────
  let faqItems = [];
  if (post.faqJson) {
    try { faqItems = JSON.parse(post.faqJson); } catch {}
  }

  // ── Ordered blocks ───────────────────────────────────────────────────────
  const blocks = buildOrderedBlocks(post);

  const hasLinkedStores = post.linkedStores?.length > 0;
  const hasRelated      = relatedPosts.filter(p => p.title).length > 0;
  const hasSidebar      = hasLinkedStores || hasRelated;

  const schemaPost = {
    slug: post.slug, featuredImage: post.featuredImage,
    publishedAt: post.publishedAt, updatedAt: post.updatedAt,
    readingTime: post.readingTime, faqJson: post.faqJson,
    title: t.title, excerpt: t.excerpt, content: t.content,
    metaTitle: t.metaTitle, metaDescription: t.metaDescription,
    author: post.author, category: post.category,
  };

  return (
    <>
      <BlogPostStructuredData post={schemaPost} locale={locale} baseUrl={baseUrl} />

      <main dir={isRTL ? 'rtl' : 'ltr'} className="bp-main">

        {/* Breadcrumb */}
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

        <div className={`bp-layout${hasSidebar ? ' bp-layout--with-sidebar' : ''}`}>

          {/* ── ARTICLE ── */}
          <article className="bp-article">

            {/* Meta */}
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
              {formattedDate && <span className="bp-meta__item">{formattedDate}</span>}
              {authorName && (
                <>
                  <span className="bp-meta__dot" aria-hidden="true" />
                  <span className="bp-meta__item">{authorName}</span>
                </>
              )}
              {post.readingTime && (
                <>
                  <span className="bp-meta__dot" aria-hidden="true" />
                  <span className="bp-meta__item">
                    {lang === 'ar' ? `${post.readingTime} دقائق` : `${post.readingTime} min read`}
                  </span>
                </>
              )}
              {post.contentType && post.contentType !== 'GUIDE' && (
                <span className="bp-content-type-badge">{post.contentType}</span>
              )}
            </div>

            {/* H1 */}
            <h1 className="bp-title">{t.title}</h1>

            {/* Cover */}
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

            {/* Lead excerpt */}
            {t.excerpt && <p className="bp-excerpt">{t.excerpt}</p>}

            {/* Main body */}
            {t.content && (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: t.content }} />
            )}

            {/* ── Ordered content blocks ── */}
            {blocks.length > 0 && (
              <div className="bp-sections">
                {blocks.map(block => {
                  if (block.type === 'SECTION') {
                    return (
                      <SectionBlock
                        key={`section-${block.id}`}
                        section={block.data}
                        locale={locale}
                      />
                    );
                  }
                  if (block.type === 'TABLE') {
                    return (
                      <ComparisonTable
                        key={`table-${block.id}`}
                        table={block.data}
                        locale={locale}
                      />
                    );
                  }
                  if (block.type === 'EMBED') {
                    return (
                      <EmbeddedPostCard
                        key={`embed-${block.id}`}
                        embed={block.data}
                        locale={locale}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* FAQ */}
            {faqItems.length > 0 && (
              <section className="bp-faq">
                <h2 className="bp-faq__title">
                  {lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                </h2>
                {faqItems.map((item, i) => (
                  <details key={i} className="bp-faq__item" open={i === 0}>
                    <summary>
                      {item.q}
                      <i className="bp-faq__icon" aria-hidden="true">+</i>
                    </summary>
                    <p className="bp-faq__answer">{item.a}</p>
                  </details>
                ))}
              </section>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
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

            {/* Author */}
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
              {hasLinkedStores && (
                <div className="bp-stores-widget">
                  <p className="bp-sidebar-heading">
                    {lang === 'ar' ? 'المتاجر في هذا المقال' : 'Stores in this article'}
                  </p>
                  <div className="bp-stores-grid">
                    {post.linkedStores.map(ls => (
                      <StoreCard key={ls.storeId} store={transformStore(ls)} />
                    ))}
                  </div>
                </div>
              )}
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
