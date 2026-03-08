// components/OfferStackBox/OfferStackBox.jsx
import Link from 'next/link';
import './OfferStackBox.css';

const TYPE_META = {
  CODE: {
    labelAr: 'كود خصم',
    labelEn: 'Code',
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

function BankLogo({ logo, name }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name || 'Bank'}
        className="stack-bank-logo"
      />
    );
  }
  // Fallback: initials
  const initials = (name || 'B')
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="stack-bank-logo-fallback">{initials}</span>
  );
}

function StackItem({ item, isAr }) {
  const meta   = TYPE_META[item.itemType] || TYPE_META.DEAL;
  const isBank = item.itemType === 'BANK_OFFER';

  return (
    <div className={`stack-item${isBank ? ' stack-item--bank' : ''}`}>

      <div className="stack-item-header">
        {isBank && (
          <BankLogo logo={item.bankLogo} name={item.bankName} />
        )}
        <span className={`stack-item-badge ${meta.cls}`}>
          <span className="material-symbols-sharp">{meta.icon}</span>
          {isAr ? meta.labelAr : meta.labelEn}
        </span>
      </div>

      <span className="stack-item-title">{item.title}</span>

      {(item.discount || item.discountPercent != null) && (
        <span className="stack-item-pct">
          {item.discount || `${item.discountPercent}%`}
        </span>
      )}

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

  const topLeft    = codeItem || dealItem;
  const topRight   = codeItem && dealItem ? dealItem : null;
  const hasTopPair = !!topRight;
  const hasBottom  = !!bankItem;

  // Single + position rule:
  //   top-pair only           → horizontal (between div1 and div2)
  //   top-pair + bottom       → vertical   (between top row and bank row)
  //   single top + bottom     → vertical   (between single item and bank row)
  const plusPos = hasTopPair && !hasBottom ? 'horizontal' : 'vertical';

  return (
    <div className="stack-box">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="stack-box-header">
        <div className="stack-store-identity">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="stack-store-logo" />
          ) : (
            <div className="stack-store-logo-placeholder">
              <span className="material-symbols-sharp">storefront</span>
            </div>
          )}
          <div className="stack-store-text">
            <span className="stack-store-name">{store.name}</span>
            <span className="stack-sub-label">
              {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Savings strip ──────────────────────────────────────────────── */}
      {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
        <div className="stack-savings-strip">
          <span className="material-symbols-sharp stack-savings-icon">savings</span>
          <span className="stack-savings-text">
            {isAr
              ? <>{isAr ? 'وفّر حتى' : 'Save up to'} <strong>{combinedSavingsPercent}%</strong> {isAr ? 'بدمج العروض' : ''}</>
              : <>Save up to <strong>{combinedSavingsPercent}%</strong> by stacking</>
            }
          </span>
        </div>
      )}

      {/* ── Items grid ─────────────────────────────────────────────────── */}
      <div className={[
        'stack-items-grid',
        hasTopPair ? 'has-top-pair' : '',
        hasBottom  ? 'has-bottom'   : '',
      ].filter(Boolean).join(' ')}>

        {topLeft && (
          <div className="stack-grid-div1">
            <StackItem item={topLeft} isAr={isAr} />
          </div>
        )}

        {topRight && (
          <div className="stack-grid-div2">
            <StackItem item={topRight} isAr={isAr} />
          </div>
        )}

        {bankItem && (
          <div className="stack-grid-div3">
            <StackItem item={bankItem} isAr={isAr} />
          </div>
        )}

        <span className={`stack-plus stack-plus--${plusPos}`} aria-hidden="true">+</span>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <Link href={storeHref} className="stack-cta">
        <span className="material-symbols-sharp">bolt</span>
        {isAr ? 'احصل على الخصم' : 'Stack & Save'}
        <span className="material-symbols-sharp">{isAr ? 'chevron_left' : 'chevron_right'}</span>
      </Link>

    </div>
  );
}
