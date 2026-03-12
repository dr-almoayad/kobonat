// components/blog/EmbeddedPostCard/EmbeddedPostCard.jsx
import Link from 'next/link';
import styles from './EmbeddedPostCard.module.css';

// Accepts either:
//   <EmbeddedPostCard embed={block.data} locale={...} />   (page.jsx usage — block.data has .embeddedPost)
//   <EmbeddedPostCard post={post} locale={...} />          (legacy direct-post usage)
export default function EmbeddedPostCard({ embed, post: postProp, locale = 'en' }) {
  const post = embed?.embeddedPost ?? postProp;
  if (!post) return null;
  const isRTL = locale === 'ar';
  const trans  = post.translations?.find(t => t.locale === locale) || post.translations?.find(t => t.locale === 'en') || {};
  const cat    = post.category?.translations?.find(t => t.locale === locale) || post.category?.translations?.find(t => t.locale === 'en');
  const author = post.author;
  const href   = `/${locale}/blog/${post.slug}`;

  return (
    <div className={styles.root} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.eyebrow}>
        <span className="material-symbols-sharp">article</span>
        {isRTL ? 'مقال ذو صلة' : 'Related article'}
      </div>
      <Link href={href} className={styles.card}>
        {post.featuredImage && (
          <div className={styles.thumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.featuredImage} alt={trans.title || ''} />
          </div>
        )}
        <div className={styles.body}>
          {cat && (
            <span className={styles.cat} style={{ '--cat-color': post.category?.color || '#470ae2' }}>
              {cat.name}
            </span>
          )}
          <h4 className={styles.title}>{trans.title}</h4>
          {trans.excerpt && <p className={styles.excerpt}>{trans.excerpt}</p>}
          <div className={styles.footer}>
            {author && (
              <div className={styles.author}>
                {author.avatarUrl
                  ? <img src={author.avatarUrl} alt={author.name} className={styles.avatar} />
                  : <span className={styles.avatarInitial}>{author.name?.[0]?.toUpperCase()}</span>}
                <span>{author.name}</span>
              </div>
            )}
            {post.readingTime && (
              <span className={styles.readTime}>
                <span className="material-symbols-sharp">schedule</span>
                {post.readingTime} {isRTL ? 'دقائق' : 'min read'}
              </span>
            )}
            <span className={styles.readCta}>
              {isRTL ? 'اقرأ المقال' : 'Read article'}
              <span className="material-symbols-sharp">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
