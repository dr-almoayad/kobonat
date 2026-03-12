// components/blog/SectionBlockRenderer/SectionBlockRenderer.jsx
// RSC — renders a single SectionBlock by type
import Link from 'next/link';
import Image from 'next/image';
import EmbeddedPostCard from '@/components/blog/EmbeddedPostCard/EmbeddedPostCard';
import ComparisonTable   from '@/components/blog/ComparisonTable/ComparisonTable';
import styles from './SectionBlockRenderer.module.css';

// ─── TEXT ─────────────────────────────────────────────────────────────────────
function TextBlock({ block, locale }) {
  const html = locale === 'ar' ? (block.textAr || block.textEn) : (block.textEn || block.textAr);
  if (!html) return null;
  return (
    <div
      className={styles.textBlock}
      dangerouslySetInnerHTML={{ __html: html }}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    />
  );
}

// ─── POST EMBED ────────────────────────────────────────────────────────────────
function PostBlock({ block, locale }) {
  if (!block.post) return null;
  return <EmbeddedPostCard embed={{ embeddedPost: block.post }} locale={locale} />;
}

// ─── COMPARISON TABLE ──────────────────────────────────────────────────────────
function TableBlock({ block, locale }) {
  if (!block.table) return null;
  return <ComparisonTable table={block.table} locale={locale} />;
}

// ─── PRODUCT ───────────────────────────────────────────────────────────────────
function ProductBlock({ block, locale }) {
  const product = block.product;
  if (!product) return null;
  const t = product.translations?.find(x => x.locale === locale)
         || product.translations?.[0];
  const title = t?.title || product.name || `Product #${product.id}`;
  const desc  = t?.description;
  const img   = product.imageUrl || product.image;

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">inventory_2</span>
        Product
      </div>
      <div className={styles.entityCardInner}>
        {img && (
          <div className={styles.entityThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={title} loading="lazy" />
          </div>
        )}
        <div className={styles.entityBody}>
          <h3 className={styles.entityTitle}>{title}</h3>
          {desc && <p className={styles.entityDesc}>{desc}</p>}
          {product.price && (
            <p className={styles.entityPrice}>{product.price}</p>
          )}
          {product.affiliateUrl && (
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={styles.entityCta}
            >
              View Deal
              <span className="material-symbols-sharp">arrow_outward</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STORE ─────────────────────────────────────────────────────────────────────
function StoreBlock({ block, locale }) {
  const store = block.store;
  if (!store) return null;
  const t = store.translations?.find(x => x.locale === locale)
         || store.translations?.[0];
  const name = t?.name || store.name || `Store #${store.id}`;
  const slug = store.slug || store.id;

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">store</span>
        Store
      </div>
      <Link href={`/${locale}/stores/${slug}`} className={styles.entityCardLink}>
        <div className={styles.entityCardInner}>
          {(store.logo || store.bigLogo) && (
            <div className={`${styles.entityThumb} ${styles.entityThumbSquare}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.bigLogo || store.logo} alt={name} loading="lazy" />
            </div>
          )}
          <div className={styles.entityBody}>
            <h3 className={styles.entityTitle}>{name}</h3>
            {t?.description && <p className={styles.entityDesc}>{t.description}</p>}
            <span className={styles.entityCta}>
              Browse coupons
              <span className="material-symbols-sharp">chevron_right</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── BANK ──────────────────────────────────────────────────────────────────────
function BankBlock({ block, locale }) {
  const bank = block.bank;
  if (!bank) return null;
  const t = bank.translations?.find(x => x.locale === locale)
         || bank.translations?.[0];
  const name = t?.name || `Bank #${bank.id}`;

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">account_balance</span>
        Bank
      </div>
      <div className={styles.entityCardInner}>
        {bank.logo && (
          <div className={`${styles.entityThumb} ${styles.entityThumbSquare}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bank.logo} alt={name} loading="lazy" />
          </div>
        )}
        <div className={styles.entityBody}>
          <h3 className={styles.entityTitle}>{name}</h3>
          {t?.description && <p className={styles.entityDesc}>{t.description}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── CREDIT CARD ───────────────────────────────────────────────────────────────
function CardBlock({ block, locale }) {
  const card = block.card;
  if (!card) return null;
  const t = card.translations?.find(x => x.locale === locale)
         || card.translations?.[0];
  const name      = t?.name || `Card #${card.id}`;
  const bankName  = card.bank?.translations?.find(x => x.locale === locale)?.name
                 || card.bank?.translations?.[0]?.name;
  const benefits  = t?.benefits || t?.description;

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">credit_card</span>
        Credit Card
      </div>
      <div className={styles.entityCardInner}>
        {card.image && (
          <div className={`${styles.entityThumb} ${styles.cardThumb}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt={name} loading="lazy" />
          </div>
        )}
        <div className={styles.entityBody}>
          {bankName && <span className={styles.entityMeta}>{bankName}</span>}
          <h3 className={styles.entityTitle}>{name}</h3>
          {benefits && <p className={styles.entityDesc}>{benefits}</p>}
          {card.networkType && (
            <span className={styles.networkBadge}>{card.networkType}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SectionBlockRenderer({ block, locale }) {
  switch (block.type) {
    case 'TEXT':    return <TextBlock    block={block} locale={locale} />;
    case 'POST':    return <PostBlock    block={block} locale={locale} />;
    case 'TABLE':   return <TableBlock   block={block} locale={locale} />;
    case 'PRODUCT': return <ProductBlock block={block} locale={locale} />;
    case 'STORE':   return <StoreBlock   block={block} locale={locale} />;
    case 'BANK':    return <BankBlock    block={block} locale={locale} />;
    case 'CARD':    return <CardBlock    block={block} locale={locale} />;
    default:        return null;
  }
}
