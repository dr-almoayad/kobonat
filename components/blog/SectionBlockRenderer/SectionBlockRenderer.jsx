// components/blog/SectionBlockRenderer/SectionBlockRenderer.jsx
// Renders a single SectionBlock in the public blog post view.
// Handles: TEXT, VOUCHER, PROMO, STORE, PRODUCT, POST, TABLE, BANK, CARD

import Link from 'next/link';
import Image from 'next/image';
import styles from './SectionBlockRenderer.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Voucher card
// ─────────────────────────────────────────────────────────────────────────────
function VoucherBlock({ voucher, locale }) {
  if (!voucher) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = voucher.translations?.[0] || {};
  const store   = voucher.store;
  const storeName = store?.translations?.[0]?.name || '';
  const storeSlug = store?.translations?.[0]?.slug || String(store?.id || '');

  const isCode = ['CODE'].includes(voucher.type);
  const label  = isRTL
    ? (isCode ? 'كود الخصم' : 'عرض')
    : (isCode ? 'Coupon Code' : 'Deal');

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">{isCode ? 'confirmation_number' : 'local_fire_department'}</span>
        {label}
      </div>
      <div className={styles.entityCardInner}>
        <div className={styles.entityBody}>
          {storeName && <div className={styles.entityMeta}>{storeName}</div>}
          <div className={styles.entityTitle}>{t.title || (isRTL ? 'عرض' : 'Offer')}</div>
          {t.description && <div className={styles.entityDesc}>{t.description}</div>}
          {voucher.discount && <div className={styles.entityPrice}>{voucher.discount}</div>}
          {voucher.code && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <code style={{ background: '#f5f3ff', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.82rem' }}>
                {voucher.code}
              </code>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                {isRTL ? 'انسخ الكود' : 'copy code'}
              </span>
            </div>
          )}
          <div className={styles.entityCta}>
            {voucher.landingUrl && (
              <a href={voucher.landingUrl} target="_blank" rel="nofollow noopener noreferrer">
                {isRTL ? 'تسوق الآن' : 'Shop Now'}
              </a>
            )}
            {storeSlug && (
              <Link href={`/${locale}/stores/${storeSlug}`}>
                {isRTL ? `كل عروض ${storeName} →` : `All ${storeName} deals →`}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Promo block (bank/ payment offer)
// ─────────────────────────────────────────────────────────────────────────────
function PromoBlock({ promo, locale }) {
  if (!promo) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = promo.translations?.[0] || {};
  const bank    = promo.bank;
  const store   = promo.store;
  const bankName  = bank?.translations?.[0]?.name  || '';
  const storeName = store?.translations?.[0]?.name || '';

  const typeColorMap = {
    BANK_OFFER:    '#b45309',
    CARD_OFFER:    '#7c3aed',
    PAYMENT_OFFER: '#0369a1',
    SEASONAL:      '#065f46',
  };
  const color = typeColorMap[promo.type] || '#6b7280';

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge} style={{ color, background: `${color}10`, borderBottomColor: `${color}20` }}>
        <span className="material-symbols-sharp">account_balance</span>
        {promo.type?.replace('_', ' ')}
      </div>
      <div className={styles.entityCardInner}>
        {bank?.logo && (
          <div className={styles.entityThumb}>
            <img src={bank.logo} alt={bankName} />
          </div>
        )}
        <div className={styles.entityBody}>
          {bankName && <div className={styles.entityMeta}>{bankName}</div>}
          <div className={styles.entityTitle}>{t.title || (isRTL ? 'عرض بنكي' : 'Bank Offer')}</div>
          {t.description && <div className={styles.entityDesc}>{t.description}</div>}
          {(promo.discountPercent || promo.verifiedAvgPercent) && (
            <div className={styles.entityPrice}>
              {isRTL ? `خصم ${promo.verifiedAvgPercent ?? promo.discountPercent}٪` : `${promo.verifiedAvgPercent ?? promo.discountPercent}% off`}
            </div>
          )}
          {t.terms && <div className={styles.entityDesc} style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{t.terms}</div>}
          <div className={styles.entityCta}>
            {promo.url && <a href={promo.url} target="_blank" rel="nofollow noopener noreferrer">{isRTL ? 'احصل على العرض' : 'Get Offer'}</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Store block
// ─────────────────────────────────────────────────────────────────────────────
function StoreBlock({ store, locale }) {
  if (!store) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = store.translations?.[0] || {};
  const logo    = store.logo || store.bigLogo;

  return (
    <Link href={`/${locale}/stores/${t.slug || store.id}`} className={styles.entityCardLink}>
      <div className={styles.entityCard}>
        <div className={styles.entityBadge}>
          <span className="material-symbols-sharp">storefront</span>
          {isRTL ? 'متجر' : 'Store'}
        </div>
        <div className={styles.entityCardInner}>
          {logo && (
            <div className={`${styles.entityThumb} ${styles.entityThumbSquare}`}>
              <img src={logo} alt={t.name || ''} />
            </div>
          )}
          <div className={styles.entityBody}>
            <div className={styles.entityTitle}>{t.name || (isRTL ? 'متجر' : 'Store')}</div>
            {t.description && <div className={styles.entityDesc}>{t.description}</div>}
            <div className={styles.entityCta}>
              <span>{isRTL ? 'عرض العروض →' : 'View offers →'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product block
// ─────────────────────────────────────────────────────────────────────────────
function ProductBlock({ product, locale }) {
  if (!product) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = product.translations?.[0] || {};

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">inventory_2</span>
        {isRTL ? 'منتج' : 'Product'}
      </div>
      <div className={styles.entityCardInner}>
        {product.image && (
          <div className={`${styles.entityThumb} ${styles.cardThumb}`}>
            <img src={product.image} alt={t.title || ''} />
          </div>
        )}
        <div className={styles.entityBody}>
          <div className={styles.entityTitle}>{t.title || (isRTL ? 'منتج' : 'Product')}</div>
          {product.discountValue && (
            <div className={styles.entityPrice}>
              {product.discountType === 'PERCENTAGE' ? `${product.discountValue}% OFF` : `${product.discountValue} SAR OFF`}
            </div>
          )}
          {product.productUrl && (
            <a href={product.productUrl} target="_blank" rel="nofollow noopener noreferrer" className={styles.entityCta}>
              {isRTL ? 'تسوق الآن →' : 'Shop now →'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog post embed card
// ─────────────────────────────────────────────────────────────────────────────
function PostBlock({ post, locale }) {
  if (!post) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = post.translations?.[0] || {};
  const author  = post.author;
  const authorName = lang === 'ar' ? (author?.nameAr || author?.name) : author?.name;

  return (
    <Link href={`/${locale}/blog/${post.slug}`} className={styles.entityCardLink}>
      <div className={styles.entityCard}>
        <div className={styles.entityBadge}>
          <span className="material-symbols-sharp">article</span>
          {isRTL ? 'مقال ذو صلة' : 'Related article'}
        </div>
        <div className={styles.entityCardInner}>
          {post.featuredImage && (
            <div className={`${styles.entityThumb} ${styles.cardThumb}`}>
              <img src={post.featuredImage} alt={t.title || ''} />
            </div>
          )}
          <div className={styles.entityBody}>
            <div className={styles.entityTitle}>{t.title}</div>
            {authorName && <div className={styles.entityMeta}>{authorName}</div>}
            {t.excerpt && <div className={styles.entityDesc}>{t.excerpt}</div>}
            <div className={styles.entityCta}>
              <span>{isRTL ? 'اقرأ المزيد ←' : 'Read more →'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table (ComparisonTable) embed
// ─────────────────────────────────────────────────────────────────────────────
function TableBlock({ table, locale }) {
  if (!table) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = table.translations?.[0] || {};

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">table_chart</span>
        {isRTL ? 'جدول مقارنة' : 'Comparison table'}
      </div>
      <div className={styles.entityCardInner}>
        <div className={styles.entityBody}>
          <div className={styles.entityTitle}>{t.title || `Table #${table.id}`}</div>
          {t.subtitle && <div className={styles.entityDesc}>{t.subtitle}</div>}
          <div className={styles.entityCta}>
            <span>{isRTL ? 'عرض الجدول ↓' : 'View table ↓'}</span>
          </div>
        </div>
      </div>
      {/* Actual ComparisonTable component would be rendered below, but for brevity we keep the preview */}
      {/* You can replace this placeholder with your full ComparisonTable component */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bank block
// ─────────────────────────────────────────────────────────────────────────────
function BankBlock({ bank, locale }) {
  if (!bank) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = bank.translations?.[0] || {};

  return (
    <Link href={`/${locale}/bank-offers?bank=${bank.slug}`} className={styles.entityCardLink}>
      <div className={styles.entityCard}>
        <div className={styles.entityBadge}>
          <span className="material-symbols-sharp">account_balance</span>
          {isRTL ? 'بنك' : 'Bank'}
        </div>
        <div className={styles.entityCardInner}>
          {bank.logo && (
            <div className={`${styles.entityThumb} ${styles.entityThumbSquare}`}>
              <img src={bank.logo} alt={t.name || ''} />
            </div>
          )}
          <div className={styles.entityBody}>
            <div className={styles.entityTitle}>{t.name || bank.slug}</div>
            {t.description && <div className={styles.entityDesc}>{t.description}</div>}
            <div className={styles.entityCta}>
              <span>{isRTL ? 'عرض العروض →' : 'View offers →'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card block (credit card)
// ─────────────────────────────────────────────────────────────────────────────
function CardBlock({ card, locale }) {
  if (!card) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = card.translations?.[0] || {};
  const bank    = card.bank;
  const bankName = bank?.translations?.[0]?.name || '';

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityBadge}>
        <span className="material-symbols-sharp">credit_card</span>
        {isRTL ? 'بطاقة ائتمان' : 'Credit card'}
      </div>
      <div className={styles.entityCardInner}>
        {card.image && (
          <div className={`${styles.entityThumb} ${styles.entityThumbSquare}`}>
            <img src={card.image} alt={t.name || ''} />
          </div>
        )}
        <div className={styles.entityBody}>
          <div className={styles.entityTitle}>{t.name || `${card.network} ${card.tier}`}</div>
          {bankName && <div className={styles.entityMeta}>{bankName}</div>}
          {t.description && <div className={styles.entityDesc}>{t.description}</div>}
          <div className={styles.entityCta}>
            <Link href={`/${locale}/bank-offers?card=${card.id}`}>
              {isRTL ? 'عرض العروض →' : 'View offers →'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text block
// ─────────────────────────────────────────────────────────────────────────────
function TextBlock({ block, locale }) {
  const lang  = locale.split('-')[0];
  const isRTL = lang === 'ar';
  const text  = isRTL ? (block.textAr || block.textEn) : (block.textEn || block.textAr);
  if (!text) return null;
  return (
    <div
      className={styles.textBlock}
      dir={isRTL ? 'rtl' : 'ltr'}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main renderer
// ─────────────────────────────────────────────────────────────────────────────
export default function SectionBlockRenderer({ block, locale }) {
  switch (block.type) {
    case 'TEXT':
      return <TextBlock block={block} locale={locale} />;
    case 'VOUCHER':
      return <VoucherBlock voucher={block.voucher} locale={locale} />;
    case 'PROMO':
      return <PromoBlock promo={block.promo} locale={locale} />;
    case 'STORE':
      return <StoreBlock store={block.store} locale={locale} />;
    case 'PRODUCT':
      return <ProductBlock product={block.product} locale={locale} />;
    case 'POST':
      return <PostBlock post={block.post} locale={locale} />;
    case 'TABLE':
      return <TableBlock table={block.table} locale={locale} />;
    case 'BANK':
      return <BankBlock bank={block.bank} locale={locale} />;
    case 'CARD':
      return <CardBlock card={block.card} locale={locale} />;
    default:
      return null;
  }
}
