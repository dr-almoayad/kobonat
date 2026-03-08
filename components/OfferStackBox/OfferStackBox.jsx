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
  const isBank = item.itemType === 'BANK_OFFER';

  return (
    <div className={`stack-item ${isBank ? 'stack-item--bank' : ''}`}>
      <div className="stack-item-top-row">
        {/* Bank logo if available */}
        {isBank && item.bankLogo && (
          <img
            src={item.bankLogo}
            alt={item.bankName || 'Bank'}
            className="stack-bank-logo"
          />
        )}
        <span className={`stack-item-type-badge ${meta.cls}`}>
          <span className="material-symbols-sharp">{meta.icon}</span>
          {isAr ? meta.labelAr : meta.labelEn}
        </span>
      </div>

      <span className="stack-item-title">{item.title}</span>

      {/* Discount value */}
      {(item.discount || item.discountPercent != null) && (
        <span className="stack-item-discount">
          {item.discount || `${item.discountPercent}%`}
        </span>
      )}

      {/* Code pill */}
      {item.code && (
        <span className="stack-item-code">
          <span className="material-symbols-sharp">content_cut</span>
          {item.code}
        </span>
      )}
    </div>
  );
}

export default function OfferStackBox({ stack, locale }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;
  const storeHref = `/${locale}/stores/${store.slug}`;

  const codeItem = items.find(i => i.itemType === 'CODE');
  const dealItem = items.find(i => i.itemType === 'DEAL');
  const bankItem = items.find(i => i.itemType === 'BANK_OFFER');

  // Layout logic:
  //   3 items → 2×2 grid: CODE top-left, DEAL top-right, BANK full-width bottom
  //             one + placed vertically between the top row and bottom row
  //   2 items, both top (CODE+DEAL) → side by side
  //             one + placed horizontally between them
  //   2 items, one top + bank → stacked vertically
  //             one + placed vertically between them
  const topLeft  = codeItem || dealItem;
  const topRight = codeItem && dealItem ? dealItem : null;
  const hasTopPair = !!topRight;
  const hasBottom  = !!bankItem;

  // Which single + to show and where:
  //   hasTopPair && hasBottom → vertical + between row 1 and row 2
  //   hasTopPair && !hasBottom → horizontal + between div1 and div2
  //   !hasTopPair && hasBottom → vertical + between single top item and bank
  const plusPosition = hasTopPair && hasBottom
    ? 'vertical'
    : hasTopPair
      ? 'horizontal'
      : 'vertical';

  const ctaText = isAr ? 'احصل على الخصم' : 'Stack & Save';

  return (
    <div className="stack-box">

      {/* ── Header ── */}
      <div className="stack-box-header">
        {store.logo ? (
          <img
            src={store.logo}
            alt={store.name}
            className="stack-store-logo"
          />
        ) : (
          <div className="stack-store-logo-placeholder">
            <span className="material-symbols-sharp">storefront</span>
          </div>
        )}

        <div className="stack-store-info">
          <span className="stack-store-name">{store.name}</span>
          <span className="stack-label">
            {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
          </span>
        </div>

        {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
          <span className="stack-savings-badge">
            {isAr
              ? <><strong>{combinedSavingsPercent}%</strong> توفير</>
              : <>Save <strong>{combinedSavingsPercent}%</strong></>
            }
          </span>
        )}
      </div>

      {/* ── Items grid ── */}
      <div className={[
        'stack-items-grid',
        hasTopPair   ? 'has-top-pair'  : '',
        hasBottom    ? 'has-bottom'    : '',
      ].filter(Boolean).join(' ')}>

        {/* Top-left slot */}
        {topLeft && (
          <div className="stack-grid-div1">
            <StackItem item={topLeft} isAr={isAr} />
          </div>
        )}

        {/* Top-right slot (only when both CODE and DEAL exist) */}
        {topRight && (
          <div className="stack-grid-div2">
            <StackItem item={topRight} isAr={isAr} />
          </div>
        )}

        {/* Bottom full-width slot */}
        {bankItem && (
          <div className="stack-grid-div3">
            <StackItem item={bankItem} isAr={isAr} />
          </div>
        )}

        {/* Single + connector — position depends on layout */}
        <span
          className={`stack-plus stack-plus--${plusPosition}`}
          aria-hidden="true"
        >+</span>

      </div>

      {/* ── CTA — always pinned to bottom via flex ── */}
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
