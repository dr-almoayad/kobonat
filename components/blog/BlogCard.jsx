// components/blog/BlogCard.jsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

// ============================================================================
// PROPS
// post: {
//   slug, featuredImage, title, excerpt, publishedAt,
//   author: { name, avatar },
//   category: { slug, name, color },
//   tags: [{ slug, name }]
// }
// locale: 'ar-SA' | 'en-SA'
// variant: 'default' | 'compact' | 'featured'
//   - default  → blog index grid
//   - compact  → sidebar / store page
//   - featured → homepage hero card (larger)
// ============================================================================

export default function BlogCard({ post, locale, variant = 'default' }) {
  if (!post) return null;

  const isRTL     = locale?.startsWith('ar');
  const [lang]    = (locale || 'en-SA').split('-');
  const postUrl   = `/${locale}/blog/${post.slug}`;
  const readMore  = lang === 'ar' ? 'اقرأ المزيد' : 'Read More';

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
        .format(new Date(post.publishedAt))
    : '';

  // ------------------------------------------------------------------
  // COMPACT variant — for store pages / sidebars
  // ------------------------------------------------------------------
  if (variant === 'compact') {
    return (
      <article
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          padding: '12px 0',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        {post.featuredImage && (
          <Link href={postUrl} style={{ flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden' }}>
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </Link>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={postUrl}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#1a1a1a',
              textDecoration: 'none',
              lineHeight: 1.4
            }}
          >
            {post.title}
          </Link>
          {formattedDate && (
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>
              {formattedDate}
            </p>
          )}
        </div>
      </article>
    );
  }

  // ------------------------------------------------------------------
  // FEATURED variant — homepage hero (large card)
  // ------------------------------------------------------------------
  if (variant === 'featured') {
    return (
      <article
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
        }}
      >
        {/* Image */}
        <Link href={postUrl} style={{ display: 'block', position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}>
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: post.category?.color || '#470ae2',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 40 }}>📝</span>
            </div>
          )}
          {/* Category badge */}
          {post.category && (
            <span style={{
              position: 'absolute',
              top: 12, [isRTL ? 'right' : 'left']: 12,
              background: post.category.color || '#470ae2',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}>
              {post.category.name}
            </span>
          )}
        </Link>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Link href={postUrl} style={{ textDecoration: 'none' }}>
            <h3 style={{
              margin: '0 0 10px',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {post.title}
            </h3>
          </Link>
          <p style={{
            margin: '0 0 16px',
            fontSize: '0.875rem',
            color: '#555',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1
          }}>
            {post.excerpt}
          </p>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTop: '1px solid #f0f0f0',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {post.author?.avatar && (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name || ''}
                  width={28}
                  height={28}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontSize: '0.75rem', color: '#777', fontWeight: 500 }}>
                {post.author?.name}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{formattedDate}</span>
          </div>
        </div>
      </article>
    );
  }

  // ------------------------------------------------------------------
  // DEFAULT variant — blog index grid
  // ------------------------------------------------------------------
  return (
    <article
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Image */}
      <Link href={postUrl} style={{ display: 'block', position: 'relative', paddingTop: '60%' }}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: 36, opacity: 0.4 }}>📝</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Category + Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
          {post.category && (
            <Link
              href={`/${locale}/blog?category=${post.category.slug}`}
              style={{
                background: (post.category.color || '#470ae2') + '18',
                color: post.category.color || '#470ae2',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.7rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              {post.category.name}
            </Link>
          )}
          <time style={{ fontSize: '0.72rem', color: '#aaa' }}>{formattedDate}</time>
        </div>

        {/* Title */}
        <Link href={postUrl} style={{ textDecoration: 'none' }}>
          <h3 style={{
            margin: '0 0 8px',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p style={{
          margin: '0 0 16px',
          fontSize: '0.85rem',
          color: '#666',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {post.excerpt}
        </p>

        {/* Read More */}
        <Link
          href={postUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#470ae2',
            textDecoration: 'none'
          }}
        >
          {readMore} {isRTL ? '←' : '→'}
        </Link>
      </div>
    </article>
  );
}
