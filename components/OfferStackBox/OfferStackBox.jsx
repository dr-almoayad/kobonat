// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
import './OfferStackBox.css';

// Per-type visual tokens — drive both the item block and badge
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

// ── Store logo: white pill ─────────────────────────────────────────────────────
function StoreLogo({ logo, name }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name || 'Store'} className="sb-store-logo" />
    );
  }
  const initials = (name || 'S').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <div className="sb-store-logo-fallback">{initials}</div>;
}

// ── Bank logo inside item block ────────────────────────────────────────────────
function BankLogo({ logo, name }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name || 'Bank'} className="sb-bank-logo" />
    );
  }
  const initials = (name || 'B').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <div className="sb-bank-logo-fallback">{initials}</div>;
}

// ── Single offer item block ────────────────────────────────────────────────────
function StackItem({ item, isAr }) {
  const meta   = TYPE_META[item.itemType] || TYPE_META.DEAL;
  const isBank = item.itemType === 'BANK_OFFER';

  return (
    <div className={`sb-item ${meta.cls}`}>

      {/* Top row: icon badge + bank logo */}
      <div className="sb-item-top">
        <span className="sb-item-type-badge">
          <span className="material-symbols-sharp">{meta.icon}</span>
          {isAr ? meta.labelAr : meta.labelEn}
        </span>
        {isBank && <BankLogo logo={item.bankLogo} name={item.bankName} />}
      </div>

      {/* Discount number — the hero stat */}
      {(item.discountPercent != null || item.discount) && (
        <div className="sb-item-pct">
          {item.discountPercent != null ? `${item.discountPercent}%` : item.discount}
        </div>
      )}

      {/* Title */}
      <p className="sb-item-title">{item.title}</p>

      {/* Code pill — monospace, white dashed border */}
      {item.code && (
        <span className="sb-item-code">
          <span className="material-symbols-sharp">confirmation_number</span>
          {item.code}
        </span>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export default function OfferStackBox({ stack, locale }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;

  const codeItem = items.find(i => i.itemType === 'CODE');
  const dealItem = items.find(i => i.itemType === 'DEAL');
  const bankItem = items.find(i => i.itemType === 'BANK_OFFER');

  const topLeft    = codeItem || dealItem;
  const topRight   = codeItem && dealItem ? dealItem : null;
  const hasTopPair = !!topRight;
  const hasBottom  = !!bankItem;
  const plusPos    = hasTopPair && !hasBottom ? 'horizontal' : 'vertical';

  return (
    <div className="sb-card" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Dark header: store identity + savings badge ── */}
      <div className="sb-header">
        <div className="sb-store-row">
          <StoreLogo logo={store.logo} name={store.name} />
          <div className="sb-store-text">
            <span className="sb-store-name">{store.name}</span>
            <span className="sb-store-sub">
              {isAr ? 'عروض قابلة للجمع' : 'Stackable offers'}
            </span>
          </div>
        </div>

        {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
          <div className="sb-savings-badge">
            <span className="sb-savings-pct">{combinedSavingsPercent}%</span>
            <span className="sb-savings-label">{isAr ? 'توفير' : 'off'}</span>
          </div>
        )}
      </div>

      {/* ── Item blocks grid ── */}
      <div className={[
        'sb-grid',
        hasTopPair ? 'has-top-pair' : '',
        hasBottom  ? 'has-bottom'   : '',
      ].filter(Boolean).join(' ')}>

        {topLeft && (
          <div className="sb-grid-div1">
            <StackItem item={topLeft} isAr={isAr} />
          </div>
        )}

        {topRight && (
          <div className="sb-grid-div2">
            <StackItem item={topRight} isAr={isAr} />
          </div>
        )}

        {bankItem && (
          <div className="sb-grid-div3">
            <StackItem item={bankItem} isAr={isAr} />
          </div>
        )}

        {/* "+" connector */}
        <div className={`sb-plus sb-plus--${plusPos}`} aria-hidden="true">
          <span>+</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="sb-cta-wrap">
        <StackCta stack={stack} locale={locale} />
      </div>

    </div>
  );
}
