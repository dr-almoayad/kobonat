// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
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

  const codeItem = items.find(i => i.itemType === 'CODE');
  const dealItem = items.find(i => i.itemType === 'DEAL');
  const bankItem = items.find(i => i.itemType === 'BANK_OFFER');

  const topLeft    = codeItem || dealItem;
  const topRight   = codeItem && dealItem ? dealItem : null;
  const hasTopPair = !!topRight;
  const hasBottom  = !!bankItem;

  // Ordered items for desktop strip
  const orderedItems = [topLeft, topRight, bankItem].filter(Boolean);

  return (
    <div
      className="stack-box"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
        <div className={`stack-ribbon${isAr ? ' stack-ribbon--rtl' : ''}`}>
          {isAr ? `وفر ${combinedSavingsPercent}%` : `Save ${combinedSavingsPercent}%`}
        </div>
      )}

      {/* Store panel */}
      <div className="stack-store-panel">
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

      {/* Mobile grid */}
      <div className="stack-items-grid">
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
        {hasTopPair && (
          <span className={`stack-plus stack-plus--${hasBottom ? 'vertical' : 'horizontal'}`} aria-hidden="true">+</span>
        )}
      </div>

      {/* Desktop strip */}
      <div className="stack-items-strip">
        {orderedItems.map((item, idx) => (
          <div key={idx} className="stack-strip-slot">
            <StackItem item={item} isAr={isAr} />
            {idx < orderedItems.length - 1 && (
              <span className="stack-plus stack-plus--strip" aria-hidden="true">+</span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="stack-cta-panel">
        <StackCta stack={stack} locale={locale} />
      </div>
    </div>
  );
}
