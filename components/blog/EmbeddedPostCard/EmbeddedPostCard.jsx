// components/blog/EmbeddedPostCard/EmbeddedPostCard.jsx
import Link from 'next/link';
import styles from './EmbeddedPostCard.module.css';

export default function EmbeddedPostCard({ embed, post: postProp, locale = 'en' }) {
  const post = embed?.embeddedPost ?? postProp;
  if (!post) return null;

  // 1. EXTRACT BASE LANG (e.g., 'ar-SA' -> 'ar')
  const lang = locale.split('-')[0];
  const isRTL = lang === 'ar';

  // 2. SEARCH USING THE BASE LANG
  // We check for 'lang' (ar) instead of 'locale' (ar-SA)
  const trans = post.translations?.find(t => t.locale === lang) 
             || post.translations?.find(t => t.locale === 'en') 
             || {};

  const cat = post.category?.translations?.find(t => t.locale === lang) 
           || post.category?.translations?.find(t => t.locale === 'en');

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
              {/* Note: In RTL layouts, the forward arrow icon automatically flips if using standard icons, 
                  but sometimes you want to swap the icon name manually if it looks wrong */}
              <span className="material-symbols-sharp">
                {isRTL ? 'arrow_backward' : 'arrow_forward'}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
