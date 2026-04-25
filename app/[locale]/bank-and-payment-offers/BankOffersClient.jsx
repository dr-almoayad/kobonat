'use client';
// app/[locale]/bank-and-payment-offers/BankOffersClient.jsx
// Interactive tab filtering for bank/payment offers.
// Props come fully resolved from the server — zero client-side fetching.

import { useState, useMemo, useCallback } from 'react';

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  ALL: {
    label_ar: 'الكل',
    label_en: 'All Offers',
    icon:     'view_module',
  },
  BANK_OFFER: {
    label_ar: 'عروض البنوك',
    label_en: 'Bank Offers',
    icon:     'account_balance',
  },
  CARD_OFFER: {
    label_ar: 'عروض البطاقات',
    label_en: 'Card Offers',
    icon:     'credit_card',
  },
  PAYMENT_OFFER: {
    label_ar: 'عروض الدفع',
    label_en: 'Payment Offers',
    icon:     'payments',
  },
  SEASONAL: {
    label_ar: 'عروض موسمية',
    label_en: 'Seasonal',
    icon:     'event',
  },
  OTHER: {
    label_ar: 'أخرى',
    label_en: 'Other',
    icon:     'redeem',
  },
};

const TAG_CLASS = {
  BANK_OFFER:    'bo-tag--bank',
  CARD_OFFER:    'bo-tag--card',
  PAYMENT_OFFER: 'bo-tag--payment',
  SEASONAL:      'bo-tag--seasonal',
  OTHER:         'bo-tag--other',
};

const BAND_COLORS = {
  BANK_OFFER:    'linear-gradient(90deg, #1d4ed8, #3b82f6)',
  CARD_OFFER:    'linear-gradient(90deg, #9d174d, #ec4899)',
  PAYMENT_OFFER: 'linear-gradient(90deg, #065f46, #10b981)',
  SEASONAL:      'linear-gradient(90deg, #92400e, #f59e0b)',
  OTHER:         'linear-gradient(90deg, #475569, #94a3b8)',
};

// ── Helper: days until expiry ─────────────────────────────────────────────────

function daysUntil(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - Date.now()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

// ── Copy helper ───────────────────────────────────────────────────────────────

function useCopy() {
  const [copiedId, setCopied] = useState(null);
  const copy = useCallback((text, id) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);
  return { copiedId, copy };
}

// ── Offer card ────────────────────────────────────────────────────────────────

function OfferCard({ offer, isAr }) {
  const { copiedId, copy } = useCopy();
  const days = daysUntil(offer.expiryDate);
  const expiringSoon = days !== null && days <= 7;

  const effectivePct =
    offer.verifiedAvgPercent ?? offer.discountPercent ?? null;

  const typeLabel = isAr
    ? TYPE_CONFIG[offer.type]?.label_ar
    : TYPE_CONFIG[offer.type]?.label_en;

  return (
    <div className="bo-card">
      {/* Top colour band */}
      <div
        className="bo-card-band"
        style={{ background: BAND_COLORS[offer.type] || BAND_COLORS.OTHER }}
      />

      {/* Header: logos + discount */}
      <div className="bo-card-header">
        <div className="bo-card-logos">
          {/* Bank or payment method logo */}
          {offer.bankLogo || offer.paymentMethodLogo ? (
            <div className="bo-logo-wrap">
              <img
                src={offer.bankLogo || offer.paymentMethodLogo}
                alt={offer.bankName || offer.paymentMethodName || ''}
              />
            </div>
          ) : (
            <div
              className="bo-logo-placeholder"
              style={{ background: '#f1f5f9' }}
            >
              <span className="material-symbols-sharp" style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                {offer.type === 'PAYMENT_OFFER' ? 'payments' : 'account_balance'}
              </span>
            </div>
          )}

          {/* Connector */}
          {offer.storeLogo && <div className="bo-logo-connector" />}

          {/* Store logo */}
          {offer.storeLogo && (
            <div className="bo-logo-wrap">
              <img src={offer.storeLogo} alt={offer.storeName || ''} />
            </div>
          )}
        </div>

        {/* Discount */}
        {effectivePct && (
          <div className="bo-discount-badge">
            <span className="bo-discount-pct">{Math.round(effectivePct)}%</span>
            <span className="bo-discount-label">{isAr ? 'خصم' : 'off'}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bo-card-body">
        <h3 className="bo-card-title">{offer.title}</h3>

        {offer.description && (
          <p className="bo-card-desc">{offer.description}</p>
        )}

        {/* Meta tags */}
        <div className="bo-card-meta">
          {/* Type badge */}
          <span className={`bo-tag ${TAG_CLASS[offer.type] || 'bo-tag--other'}`}>
            <span className="material-symbols-sharp">
              {TYPE_CONFIG[offer.type]?.icon || 'redeem'}
            </span>
            {typeLabel}
          </span>

          {/* Expiry warning */}
          {expiringSoon && (
            <span className="bo-tag bo-tag--expiring">
              <span className="material-symbols-sharp">schedule</span>
              {isAr ? `ينتهي خلال ${days} يوم` : `Expires in ${days}d`}
            </span>
          )}
        </div>

        {/* Entity names */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {(offer.bankName || offer.cardName) && (
            <div className="bo-card-store">
              <span className="material-symbols-sharp" style={{ fontSize: '0.875rem' }}>
                account_balance
              </span>
              {offer.bankName}
              {offer.cardName && ` · ${offer.cardName}`}
            </div>
          )}
          {offer.paymentMethodName && (
            <div className="bo-card-store">
              <span className="material-symbols-sharp" style={{ fontSize: '0.875rem' }}>
                payments
              </span>
              {offer.paymentMethodName}
            </div>
          )}
          {offer.storeName && (
            <div className="bo-card-store">
              {offer.storeLogo && (
                <img src={offer.storeLogo} alt={offer.storeName} />
              )}
              <span className="material-symbols-sharp" style={{ fontSize: '0.875rem' }}>
                storefront
              </span>
              {offer.storeName}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bo-card-footer">
        {/* Voucher code */}
        {offer.voucherCode && (
          <button
            className="bo-code-badge"
            onClick={() => copy(offer.voucherCode, offer.id)}
            title={isAr ? 'انسخ الكود' : 'Copy code'}
          >
            <span className="material-symbols-sharp">
              {copiedId === offer.id ? 'check_circle' : 'content_copy'}
            </span>
            {copiedId === offer.id
              ? (isAr ? 'تم النسخ' : 'Copied!')
              : offer.voucherCode}
          </button>
        )}

        {/* CTA */}
        {offer.url ? (
          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bo-cta"
          >
            {isAr ? 'تفعيل العرض' : 'Activate Offer'}
            <span className="material-symbols-sharp">
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </a>
        ) : (
          <span className="bo-cta bo-cta--ghost" style={{ cursor: 'default' }}>
            {isAr ? 'يطبق تلقائياً' : 'Auto-applied'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function BankOffersClient({ offers, banks, paymentMethods, isAr }) {
  const [activeType,   setActiveType]   = useState('ALL');
  const [activeEntity, setActiveEntity] = useState('ALL');

  // Derive available types from data
  const typeCounts = useMemo(() => {
    const counts = { ALL: offers.length };
    offers.forEach(o => {
      counts[o.type] = (counts[o.type] || 0) + 1;
    });
    return counts;
  }, [offers]);

  // When type changes, reset entity filter
  function handleTypeChange(type) {
    setActiveType(type);
    setActiveEntity('ALL');
  }

  // Derive entity chips based on active type
  const entityChips = useMemo(() => {
    const typeOffers = activeType === 'ALL'
      ? offers
      : offers.filter(o => o.type === activeType);

    // Which banks appear in these offers?
    const bankIds    = new Set(typeOffers.map(o => o.bankId).filter(Boolean));
    const pmIds      = new Set(typeOffers.map(o => o.paymentMethodId).filter(Boolean));

    const chips = [];

    banks.forEach(bank => {
      if (bankIds.has(bank.id)) {
        chips.push({
          id:    `bank_${bank.id}`,
          rawId: bank.id,
          kind:  'bank',
          label: bank.name,
          logo:  bank.logo,
          color: bank.color,
        });
      }
    });

    paymentMethods.forEach(pm => {
      if (pmIds.has(pm.id)) {
        chips.push({
          id:    `pm_${pm.id}`,
          rawId: pm.id,
          kind:  'pm',
          label: pm.name,
          logo:  pm.logo,
        });
      }
    });

    return chips;
  }, [activeType, offers, banks, paymentMethods]);

  // Final filtered list
  const filteredOffers = useMemo(() => {
    let list = activeType === 'ALL' ? offers : offers.filter(o => o.type === activeType);
    if (activeEntity === 'ALL') return list;

    const [kind, idStr] = activeEntity.split('_');
    const id = parseInt(idStr);
    if (kind === 'bank') return list.filter(o => o.bankId === id);
    if (kind === 'pm')   return list.filter(o => o.paymentMethodId === id);
    return list;
  }, [offers, activeType, activeEntity]);

  // Determine which types to show tabs for
  const shownTypes = ['ALL', ...Object.keys(TYPE_CONFIG).filter(
    t => t !== 'ALL' && (typeCounts[t] || 0) > 0
  )];

  return (
    <>
      {/* ── Sticky filter bar ── */}
      <div className="bo-filters">
        <div className="bo-filters-inner">

          {/* Type tabs */}
          <div className="bo-type-row" role="tablist" aria-label={isAr ? 'نوع العرض' : 'Offer type'}>
            {shownTypes.map(type => {
              const cfg = type === 'ALL'
                ? { label_ar: 'الكل', label_en: 'All Offers', icon: 'view_module' }
                : TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  role="tab"
                  aria-selected={activeType === type}
                  className={`bo-type-btn${activeType === type ? ' active' : ''}`}
                  onClick={() => handleTypeChange(type)}
                >
                  <span className="material-symbols-sharp">{cfg.icon}</span>
                  {isAr ? cfg.label_ar : cfg.label_en}
                  <span className="bo-type-count">{typeCounts[type] || 0}</span>
                </button>
              );
            })}
          </div>

          {/* Entity chips — only when there's something to filter */}
          {entityChips.length > 0 && (
            <div
              className="bo-entity-row"
              role="group"
              aria-label={isAr ? 'البنك أو وسيلة الدفع' : 'Bank or payment method'}
            >
              {/* All chip */}
              <button
                className={`bo-chip${activeEntity === 'ALL' ? ' active' : ''}`}
                onClick={() => setActiveEntity('ALL')}
              >
                {isAr ? 'الكل' : 'All'}
              </button>

              {entityChips.map(chip => (
                <button
                  key={chip.id}
                  className={`bo-chip${activeEntity === chip.id ? ' active' : ''}`}
                  onClick={() => setActiveEntity(chip.id)}
                >
                  {chip.logo ? (
                    <img src={chip.logo} alt={chip.label} />
                  ) : chip.color ? (
                    <span className="bo-chip-dot" style={{ background: chip.color }} />
                  ) : null}
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <main className="bo-main">
        <div className="bo-result-header">
          <p className="bo-result-label">
            {isAr
              ? <><strong>{filteredOffers.length}</strong> عرض متاح</>
              : <><strong>{filteredOffers.length}</strong> offer{filteredOffers.length !== 1 ? 's' : ''} available</>
            }
          </p>
        </div>

        <div className="bo-grid">
          {filteredOffers.length === 0 ? (
            <div className="bo-empty">
              <span className="material-symbols-sharp">search_off</span>
              <p>
                {isAr
                  ? 'لا توجد عروض تطابق هذا الاختيار'
                  : 'No offers match this selection'}
              </p>
            </div>
          ) : (
            filteredOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} isAr={isAr} />
            ))
          )}
        </div>
      </main>
    </>
  );
}
