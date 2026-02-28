// components/blog/StoreRelatedPosts.jsx
// Server component — renders blog posts related to a store (merchant clustering).
// Include on the store page: <StoreRelatedPosts storeId={store.id} locale={locale} />
//
// Two sources (matched by reference pattern getStoreRelatedPosts):
//   1. primaryStoreId = storeId        → "primary cluster" articles
//   2. linkedStores.some(s => storeId) → explicitly linked articles

import Link from 'next/link';
import Image from 'next/image';
import { getStoreRelatedPosts } from '@/app/admin/_lib/queries';

export default async function StoreRelatedPosts({ storeId, locale, limit = 4 }) {
  const lang  = locale?.split('-')[0] || 'ar';
  const isRTL = lang === 'ar';

  const posts = await getStoreRelatedPosts(storeId, lang, limit);
  if (!posts || posts.length === 0) return null;

  const heading = lang === 'ar' ? 'مقالات ذات صلة' : 'Related Articles';

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ marginTop: 48, padding: '32px 0', borderTop: '1px solid #f0f0f0' }}
      aria-label={heading}
    >
      <h2 style={{
        fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, color: '#1a1a1a',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {heading}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {posts.map(post => {
          const t        = post.translations?.[0] || {};
          const catName  = post.category?.translations?.[0]?.name;
          const catColor = post.category?.color || '#470ae2';

          return (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              style={{
                display: 'block', textDecoration: 'none', color: '#333',
                border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Image */}
              {post.featuredImage ? (
                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <Image
                    src={post.featuredImage}
                    alt={t.title || ''}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, 280px"
                  />
                </div>
              ) : (
                <div style={{ aspectRatio: '16/9', background: '#f5f5f5' }} />
              )}

              {/* Content */}
              <div style={{ padding: '12px 14px' }}>
                {catName && (
                  <span style={{
                    display: 'inline-block', marginBottom: 6,
                    background: catColor, color: '#fff',
                    padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                  }}>
                    {catName}
                  </span>
                )}
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35, color: '#1a1a1a' }}>
                  {t.title || post.slug}
                </p>
                {t.excerpt && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#666', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.excerpt}
                  </p>
                )}
                {post.contentType && post.contentType !== 'GUIDE' && (
                  <span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.7rem', color: '#888', background: '#f5f5f5', padding: '1px 8px', borderRadius: 8 }}>
                    {post.contentType}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 20 }}>
        <Link href={`/${locale}/blog`} style={{ fontSize: '0.85rem', color: '#470ae2', fontWeight: 600, textDecoration: 'none' }}>
          {lang === 'ar' ? 'عرض كل المقالات ←' : 'View all articles →'}
        </Link>
      </div>
    </section>
  );
}
