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
        className="osb-bank-logo"
      />
    );
  }
  const initials = (name || 'B')
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span className="osb-bank-logo-fallback">{initials}</span>;
}

function StackItem({ item, isAr }) {
  const meta = TYPE_META[item.itemType] || TYPE_META.DEAL;
  const isBank = item.itemType === 'BANK_OFFER';

  return (
    <div className={`osb-item ${isBank ? 'osb-item-bank' : ''}`}>
      <div className="osb-item-header">
        {isBank && <BankLogo logo={item.bankLogo} name={item.bankName} />}
        <span className={`osb-badge ${meta.cls}`}>
          <span className="material-symbols-sharp">{meta.icon}</span>
          {isAr ? meta.labelAr : meta.labelEn}
        </span>
      </div>

      <span className="osb-item-title">{item.title}</span>

      <div className="osb-item-footer">
        {(item.discount || item.discountPercent != null) && (
          <span className="osb-item-pct">
            {item.discount || `${item.discountPercent}%`}
          </span>
        )}
        {item.code && (
          <span className="osb-item-code">
            <span className="material-symbols-sharp">content_cut</span>
            {item.code}
          </span>
        )}
      </div>
    </div>
  );
}

export default function OfferStackBox({ stack, locale }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;

  // Ensure consistent rendering order
  const codeItem = items.find(i => i.itemType === 'CODE');
  const dealItem = items.find(i => i.itemType === 'DEAL');
  const bankItem = items.find(i => i.itemType === 'BANK_OFFER');

  const orderedItems = [codeItem, dealItem, bankItem].filter(Boolean);

  return (
    <div className="osb-container" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Savings Tag ── */}
      {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
        <div className="osb-savings-tag">
          <span className="material-symbols-sharp">workspace_premium</span>
          {isAr ? `توفير يصل إلى ${combinedSavingsPercent}%` : `Save up to ${combinedSavingsPercent}%`}
        </div>
      )}

      {/* ── Store Identity ── */}
      <div className="osb-store-panel">
        <div className="osb-store-identity">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="osb-store-logo" />
          ) : (
            <div className="osb-store-logo-placeholder">
              <span className="material-symbols-sharp">storefront</span>
            </div>
          )}
          <div className="osb-store-text">
            <span className="osb-store-name">{store.name}</span>
            <span className="osb-sub-label">
              {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Items Area ── */}
      <div className={`osb-items-area count-${orderedItems.length}`}>
        {orderedItems.map((item, idx) => (
          <div key={idx} className="osb-item-wrapper">
            <StackItem item={item} isAr={isAr} />
            {idx < orderedItems.length - 1 && (
              <div className="osb-connector">
                <span className="material-symbols-sharp">add</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── CTA Panel ── */}
      <div className="osb-cta-panel">
        <StackCta stack={stack} locale={locale} />
      </div>
    </div>
  );
}
