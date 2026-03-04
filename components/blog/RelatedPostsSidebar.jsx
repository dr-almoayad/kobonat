// components/blog/RelatedPostsSidebar.jsx
//
// Layout pattern (mirrors the screenshot exactly):
//   Group 1:  [HERO]    posts[0]  — full-width image + title + excerpt + tag + date
//             [COMPACT] posts[1]  — thumbnail left, title + tag + date right
//             [COMPACT] posts[2]  — thumbnail left, title + tag + date right
//   Group 2:  [HERO]    posts[3]  — same as above
//             [COMPACT] posts[4]
//             [COMPACT] posts[5]
//   Maximum 6 posts total (2 groups of 3).

import Image from 'next/image';
import Link from 'next/link';
import styles from './RelatedPostsSidebar.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(publishedAt, locale) {
  if (!publishedAt) return '';
  return new Intl.DateTimeFormat(locale, {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(new Date(publishedAt));
}

/** Purple/violet pill matching the screenshot's FEATURE tag style */
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
// Hero card — full-width image
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ post, locale }) {
  const postUrl = `/${locale}/blog/${post.slug}`;
  return (
    <Link href={postUrl} className={styles.hero}>
      {/* Image */}
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

      {/* Title */}
      <h3 className={styles.heroTitle}>{post.title}</h3>

      {/* Excerpt */}
      {post.excerpt && (
        <p className={styles.heroExcerpt}>{post.excerpt}</p>
      )}

      {/* Tag + date */}
      <Meta category={post.category} publishedAt={post.publishedAt} locale={locale} />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact card — thumbnail left, text right
// ─────────────────────────────────────────────────────────────────────────────
function CompactCard({ post, locale }) {
  const postUrl = `/${locale}/blog/${post.slug}`;
  return (
    <Link href={postUrl} className={styles.compact}>
      {/* Thumbnail */}
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

      {/* Text */}
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

/**
 * RelatedPostsSidebar
 *
 * Props
 *   posts  — array of post objects (max 6 consumed)
 *   locale — e.g. 'en-SA' | 'ar-SA'
 *   title  — optional heading override
 *
 * Each post object shape:
 *   { id, slug, featuredImage, title, excerpt, publishedAt,
 *     category: { slug, name, color } }
 */
export default function RelatedPostsSidebar({ posts = [], locale, title }) {
  const lang    = locale?.split('-')[0] || 'en';
  const isRTL   = lang === 'ar';
  const heading = title || (lang === 'ar' ? 'محتوى ذو صلة' : 'RELATED CONTENT');

  // Limit to 6, split into groups of 3
  const capped = posts.slice(0, 6);
  if (!capped.length) return null;

  // Chunk array into groups of 3: [[p0,p1,p2], [p3,p4,p5]]
  const groups = [];
  for (let i = 0; i < capped.length; i += 3) {
    groups.push(capped.slice(i, i + 3));
  }

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className={styles.sidebar}
      aria-label={heading}
    >
      {/* Heading */}
      <h2 className={styles.heading}>{heading}</h2>

      {/* Groups: each group = 1 hero + up to 2 compact */}
      {groups.map((group, gi) => {
        const [hero, ...compacts] = group;
        return (
          <div key={gi} className={styles.group}>
            <HeroCard post={hero} locale={locale} />
            {compacts.map(post => (
              <CompactCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        );
      })}
    </section>
  );
}
