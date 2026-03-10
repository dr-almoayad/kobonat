// components/blog/RelatedPostsSidebar.jsx
//
// Layout pattern:
//   Group 1:  [HERO]    posts[0]  — full-width image + title + excerpt + tag + date
//             [COMPACT] posts[1]  — thumbnail left, title + tag + date right
//             [COMPACT] posts[2]  — thumbnail left, title + tag + date right
//   Group 2:  [HERO]    posts[3]  — same as above
//             [COMPACT] posts[4]
//             [COMPACT] posts[5]
//   Maximum 6 posts total (2 groups of 3).
//
// ── BUG FIX ──────────────────────────────────────────────────────────────────
// The store page passes raw Prisma BlogPost objects from getStoreRelatedPosts().
// Those objects have title/excerpt nested inside translations[0], NOT as flat
// top-level fields. The old component read post.title directly → undefined →
// every card was empty and the component returned null.
//
// Fix: normalise() pulls the correct value from either shape.
// ─────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import Link from 'next/link';
import styles from './RelatedPostsSidebar.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Normalise a post regardless of whether it was pre-transformed or is a raw
// Prisma object (translations[] still intact).
// ─────────────────────────────────────────────────────────────────────────────
function normalise(post, lang) {
  // Already flat (pre-transformed by the caller)
  if (typeof post.title === 'string') return post;

  // Raw Prisma shape — extract from translations[]
  const t = post.translations?.find(tr => tr.locale === lang)
         || post.translations?.[0]
         || {};

  const cat = post.category
    ? {
        slug:  post.category.slug,
        name:  post.category.translations?.find(tr => tr.locale === lang)?.name
              || post.category.translations?.[0]?.name
              || post.category.slug,
        color: post.category.color,
      }
    : null;

  return {
    id:           post.id,
    slug:         post.slug,
    featuredImage:post.featuredImage || null,
    publishedAt:  post.publishedAt   || null,
    title:        t.title            || '',
    excerpt:      t.excerpt          || '',
    category:     cat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(publishedAt, locale) {
  if (!publishedAt) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(publishedAt));
}

const TAG_DEFAULT_COLOR = '#9333ea';

function Meta({ category, publishedAt, locale }) {
  const date = formatDate(publishedAt, locale);
  const bg   = category?.color || TAG_DEFAULT_COLOR;
  return (
    <div className={styles.meta}>
      {category && (
        <span className={styles.tag} style={{ background: bg }}>
          {(category.name || '').toUpperCase()}
        </span>
      )}
      {date && <time className={styles.date}>{date}</time>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero card
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ post, locale }) {
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className={styles.hero}>
      <div className={styles.heroImageWrap}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title || ''}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className={styles.heroImage}
            priority
          />
        ) : (
          <div className={styles.placeholder}>📰</div>
        )}
      </div>
      <h3 className={styles.heroTitle}>{post.title}</h3>
      {post.excerpt && <p className={styles.heroExcerpt}>{post.excerpt}</p>}
      <Meta category={post.category} publishedAt={post.publishedAt} locale={locale} />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact card
// ─────────────────────────────────────────────────────────────────────────────
function CompactCard({ post, locale }) {
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className={styles.compact}>
      <div className={styles.compactImageWrap}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title || ''}
            fill
            sizes="110px"
            className={styles.compactImage}
          />
        ) : (
          <div className={styles.placeholder}>📰</div>
        )}
      </div>
      <div className={styles.compactBody}>
        <h4 className={styles.compactTitle}>{post.title}</h4>
        <Meta category={post.category} publishedAt={post.publishedAt} locale={locale} />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function RelatedPostsSidebar({ posts = [], locale, title }) {
  const lang    = locale?.split('-')[0] || 'en';
  const isRTL   = lang === 'ar';
  const heading = title || (lang === 'ar' ? 'محتوى ذو صلة' : 'RELATED CONTENT');

  // Normalise every post so title/excerpt are always flat strings
  const normalised = posts
    .slice(0, 6)
    .map(p => normalise(p, lang))
    .filter(p => p.title); // drop any post that ended up with no title

  if (!normalised.length) return null;

  // Chunk into groups of 3
  const groups = [];
  for (let i = 0; i < normalised.length; i += 3) {
    groups.push(normalised.slice(i, i + 3));
  }

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className={styles.sidebar} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      {groups.map((group, gi) => {
        const [hero, ...compacts] = group;
        return (
          <div key={gi} className={styles.group}>
            <HeroCard   post={hero}   locale={locale} />
            {compacts.map(post => (
              <CompactCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        );
      })}
    </section>
  );
}
