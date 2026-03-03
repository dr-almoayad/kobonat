// components/blog/RelatedPostsSidebar.jsx
// Matches the "Related Content" sidebar layout:
//   • First post  → large hero card (full-width image + title + excerpt + tag + date)
//   • Remaining   → compact rows (small thumbnail + title + tag + date)

import Image from 'next/image';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(publishedAt, locale) {
  if (!publishedAt) return '';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(publishedAt));
}

function CategoryTag({ category }) {
  if (!category) return null;
  // Derive a stable background from the category color or fall back to a dark default
  const bg    = category.color || '#2a1a6e';
  const label = (category.name || '').toUpperCase();
  return (
    <span style={{
      display:       'inline-block',
      background:    bg,
      color:         '#fff',
      fontSize:      '0.65rem',
      fontWeight:    700,
      letterSpacing: '0.06em',
      padding:       '3px 8px',
      borderRadius:  3,
      lineHeight:    1,
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero card — first post
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ post, locale }) {
  const isRTL = locale?.startsWith('ar');
  const postUrl = `/${locale}/blog/${post.slug}`;
  const date = formatDate(post.publishedAt, locale);

  return (
    <article style={{ borderBottom: '1px solid #e8e8e8', paddingBottom: 16, marginBottom: 4 }}>
      {/* Image */}
      <Link href={postUrl} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', marginBottom: 12, background: '#f0f0f0' }}>
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title || ''}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, opacity: 0.4 }}>📰</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          margin:        '0 0 6px',
          fontSize:      '1.05rem',
          fontWeight:    700,
          color:         '#111',
          lineHeight:    1.35,
          textAlign:     isRTL ? 'right' : 'left',
          display:       '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow:      'hidden',
        }}>
          {post.title}
        </h3>
      </Link>

      {/* Excerpt */}
      {post.excerpt && (
        <p style={{
          margin:        '0 0 10px',
          fontSize:      '0.8rem',
          color:         '#666',
          lineHeight:    1.5,
          textAlign:     isRTL ? 'right' : 'left',
          display:       '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow:      'hidden',
        }}>
          {post.excerpt}
        </p>
      )}

      {/* Tag + Date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
        <CategoryTag category={post.category} />
        {date && (
          <time style={{ fontSize: '0.72rem', color: '#999', fontWeight: 500 }}>{date}</time>
        )}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact row — subsequent posts
// ─────────────────────────────────────────────────────────────────────────────
function CompactCard({ post, locale }) {
  const isRTL = locale?.startsWith('ar');
  const postUrl = `/${locale}/blog/${post.slug}`;
  const date = formatDate(post.publishedAt, locale);

  return (
    <article style={{
      display:       'flex',
      gap:           12,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems:    'flex-start',
      padding:       '12px 0',
      borderBottom:  '1px solid #e8e8e8',
    }}>
      {/* Thumbnail */}
      <Link href={postUrl} style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', width: 80, height: 60, borderRadius: 4, overflow: 'hidden', background: '#f0f0f0' }}>
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title || ''}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, opacity: 0.4 }}>📰</span>
            </div>
          )}
        </div>
      </Link>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={postUrl} style={{ textDecoration: 'none' }}>
          <h4 style={{
            margin:          '0 0 8px',
            fontSize:        '0.875rem',
            fontWeight:      700,
            color:           '#111',
            lineHeight:      1.35,
            textAlign:       isRTL ? 'right' : 'left',
            display:         '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow:        'hidden',
          }}>
            {post.title}
          </h4>
        </Link>

        {/* Tag + Date row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <CategoryTag category={post.category} />
          {date && (
            <time style={{ fontSize: '0.7rem', color: '#999', fontWeight: 500 }}>{date}</time>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RelatedPostsSidebar
 *
 * Props:
 *   posts  — array of transformed post objects (same shape as blog page produces)
 *   locale — e.g. 'en-SA' | 'ar-SA'
 *   title  — optional heading override (defaults to "Related Content" / "محتوى ذو صلة")
 */
export default function RelatedPostsSidebar({ posts = [], locale, title }) {
  if (!posts.length) return null;

  const lang   = locale?.split('-')[0] || 'en';
  const isRTL  = lang === 'ar';
  const heading = title || (lang === 'ar' ? 'محتوى ذو صلة' : 'RELATED CONTENT');

  const [first, ...rest] = posts;

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={heading}
      style={{
        background:   '#fff',
        borderRadius: 4,
        padding:      0,
      }}
    >
      {/* ── Heading ── */}
      <h2 style={{
        margin:        '0 0 14px',
        fontSize:      '0.78rem',
        fontWeight:    800,
        color:         '#111',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textAlign:     isRTL ? 'right' : 'left',
        borderBottom:  '2px solid #111',
        paddingBottom: 8,
      }}>
        {heading}
      </h2>

      {/* ── Hero card (first post) ── */}
      <HeroCard post={first} locale={locale} />

      {/* ── Compact rows (remaining posts) ── */}
      {rest.map(post => (
        <CompactCard key={post.id} post={post} locale={locale} />
      ))}
    </section>
  );
}
