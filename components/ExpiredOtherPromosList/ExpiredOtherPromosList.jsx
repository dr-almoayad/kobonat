// components/ExpiredOtherPromosList/ExpiredOtherPromosList.jsx
'use client';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import './ExpiredOtherPromosList.css';

const TYPE_META = {
  BANK_OFFER:    { icon: 'account_balance', labelAr: 'عرض بنكي',   labelEn: 'Bank Offer' },
  CARD_OFFER:    { icon: 'credit_card',     labelAr: 'عرض بطاقة',  labelEn: 'Card Offer' },
  PAYMENT_OFFER: { icon: 'payments',        labelAr: 'عرض دفع',    labelEn: 'Payment Offer' },
  SEASONAL:      { icon: 'celebration',     labelAr: 'عرض موسمي',  labelEn: 'Seasonal' },
  BUNDLE:        { icon: 'redeem',          labelAr: 'حزمة عروض',  labelEn: 'Bundle' },
  OTHER:         { icon: 'local_offer',     labelAr: 'عرض خاص',    labelEn: 'Special Offer' },
};

function formatExpiry(date, locale, isAr) {
  const d = new Date(date);
  const diff = Math.ceil((d - Date.now()) / 86_400_000);
  if (diff < 0) return isAr ? 'منتهي' : 'Expired';
  if (diff === 0) return isAr ? 'ينتهي اليوم' : 'Expires today';
  if (diff <= 3) return isAr ? `ينتهي خلال ${diff} أيام` : `${diff} days left`;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ExpiredOtherPromosList({ promos, storeName, storeLogo }) {
  const [expanded, setExpanded] = useState(false);
  const locale = useLocale();
  const isAr = locale.startsWith('ar');
  const [language] = locale.split('-');

  if (!promos || promos.length === 0) return null;

  return (
    <section className="expired-other-promos-section">
      <button
        className="expired-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="material-symbols-sharp">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
        {isAr ? 'عروض بنكية منتهية (للإطلاع فقط)' : 'Expired bank offers (for reference)'}
        <span className="expired-count">({promos.length})</span>
      </button>
      {expanded && (
        <div className="expired-grid">
          {promos.map((promo) => {
            const meta = TYPE_META[promo.type] || TYPE_META.OTHER;
            const typeLabel = isAr ? meta.labelAr : meta.labelEn;
            const expiryFormatted = promo.expiryDate ? formatExpiry(promo.expiryDate, locale, isAr) : null;
            return (
              <div key={promo.id} className="expired-other-item">
                <div className="expired-other-card">
                  {/* Image area */}
                  <div className="op-card__image-wrap">
                    {promo.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={promo.image} alt={promo.title} className="op-card__image" loading="lazy" />
                    ) : (
                      <div className="op-card__image-placeholder" />
                    )}
                    <span className="op-card__type-badge" style={{ '--_accent': '#9ca3af' }}>
                      <span className="material-symbols-sharp">{meta.icon}</span>
                      {typeLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="op-card__body">
                    {/* Logos row */}
                    {(storeLogo || promo.bank?.logo || promo.paymentMethod?.logo) && (
                      <div className="op-card__logos">
                        {storeLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={storeLogo} alt={storeName || ''} className="op-logo-bare" />
                        )}
                        {promo.bank?.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={promo.bank.logo} alt={promo.bank.name || ''} className="op-logo-bare" />
                        )}
                        {promo.paymentMethod?.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={promo.paymentMethod.logo} alt={promo.paymentMethod.name || ''} className="op-logo-bare" />
                        )}
                        {promo.paymentMethod?.isBnpl && (
                          <span className="op-bnpl-pip">{isAr ? 'تقسيط' : 'BNPL'}</span>
                        )}
                      </div>
                    )}
                    <h3 className="op-card__title">{promo.title}</h3>
                    {promo.voucherCode && (
                      <div className="op-card__code-preview">
                        <span className="material-symbols-sharp">confirmation_number</span>
                        <span>{promo.voucherCode}</span>
                      </div>
                    )}
                    <div className="op-card__footer">
                      {expiryFormatted && (
                        <span className="op-card__expiry op-card__expiry--expired">
                          <span className="material-symbols-sharp">event_busy</span>
                          {expiryFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="expired-note">
            {isAr
              ? 'هذه العروض منتهية الصلاحية. تفعيلها لن يجدي نفعاً.'
              : 'These offers have expired. Activating them will not work.'}
          </p>
        </div>
      )}
    </section>
  );
}

export default ExpiredOtherPromosList;
