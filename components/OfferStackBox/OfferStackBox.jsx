// components/OfferStackBox/OfferStackBox.jsx
import Image from 'next/image';
import Link from 'next/link';
import './OfferStackBox.css';

const TYPE_META = {
  CODE: {
    labelAr: 'كود خصم',
    labelEn: 'Coupon Code',
    icon:    'confirmation_number',
    cls:     'type-code',
  },
  DEAL: {
    labelAr: 'عرض',
    labelEn: 'Deal',
    icon:    'local_fire_department',
    cls:     'type-deal',
  },
  BANK_OFFER: {
    labelAr: 'عرض بنكي',
    labelEn: 'Bank Offer',
    icon:    'account_balance',
    cls:     'type-bank',
  },
};

function StackItem({ item, isAr }) {
  const meta = TYPE_META[item.itemType] || TYPE_META.DEAL;
  return (
    <div className="stack-item">
      <span className={`stack-item-type-badge ${meta.cls}`}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.65rem' }}>{meta.icon}</span>
        {isAr ? meta.labelAr : meta.labelEn}
      </span>
      <span className="stack-item-title">{item.title}</span>
      {item.discount && (
        <span className="stack-item-discount">{item.discount}</span>
      )}
      {item.discountPercent != null && !item.discount && (
        <span className="stack-item-discount">{item.discountPercent}%</span>
      )}
      {item.code && (
        <span className="stack-item-code">
          <span className="material-symbols-sharp" style={{ fontSize: '0.65rem', opacity: 0.7 }}>content_cut</span>
          {item.code}
        </span>
      )}
    </div>
  );
}

export default function OfferStackBox({ stack, locale }) {
  const lang  = locale?.split('-')[0] || 'ar';
  const isAr  = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;
  const storeHref = `/${locale}/stores/${store.slug}`;

  // Map items by type for deterministic slot placement
  const codeItem = items.find(i => i.itemType === 'CODE');
  const dealItem = items.find(i => i.itemType === 'DEAL');
  const bankItem = items.find(i => i.itemType === 'BANK_OFFER');

  // Top row: CODE (div1) + DEAL (div2). If only one exists, show in div1.
  const topLeft  = codeItem || dealItem;
  const topRight = codeItem ? dealItem : null;
  const hasBottom = !!bankItem;
  const hasTopPair = !!(topLeft && topRight);

  const ctaText = isAr ? 'احصل على الخصم' : 'Stack & Save';

  return (
    <div className="stack-box">
      {/* ── Header ── */}
      <div className="stack-box-header">
        {store.logo ? (
          <Image
            src={store.logo}
            alt={store.name}
            width={36}
            height={36}
            className="stack-store-logo"
            unoptimized
          />
        ) : (
          <div className="stack-store-logo-placeholder">
            <span className="material-symbols-sharp" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>storefront</span>
          </div>
        )}
        <span className="stack-store-name">{store.name}</span>
        {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
          <span className="stack-savings-badge">
            {isAr ? `وفر ${combinedSavingsPercent}%` : `Save ${combinedSavingsPercent}%`}
          </span>
        )}
      </div>

      {/* ── Sub-label ── */}
      <div className="stack-label">
        {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
      </div>

      {/* ── Items grid ── */}
      <div className={`stack-items-grid${hasBottom ? ' has-bottom' : ''}`}>

        {/* div1 — top-left */}
        {topLeft && (
          <div className="stack-grid-div1">
            <StackItem item={topLeft} isAr={isAr} />
          </div>
        )}

        {/* div2 — top-right */}
        {topRight && (
          <div className="stack-grid-div2">
            <StackItem item={topRight} isAr={isAr} />
          </div>
        )}

        {/* div3 — bottom full-width */}
        {bankItem && (
          <div className="stack-grid-div3">
            <StackItem item={bankItem} isAr={isAr} />
          </div>
        )}

        {/* ── Plus signs ── */}
        {/* Horizontal + between div1 and div2 */}
        {hasTopPair && (
          <span className="stack-plus stack-plus--h" aria-hidden="true">+</span>
        )}
        {/* Vertical + between top row and div3 */}
        {hasBottom && topLeft && (
          <span className="stack-plus stack-plus--v" aria-hidden="true">+</span>
        )}
      </div>

      {/* ── CTA ── */}
      <Link href={storeHref} className="stack-cta">
        <span className="material-symbols-sharp">bolt</span>
        {ctaText}
        <span className="material-symbols-sharp">
          {isAr ? 'chevron_left' : 'chevron_right'}
        </span>
      </Link>
    </div>
  );
}
