'use client';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import VoucherCard from '../VoucherCard/VoucherCard';
import './ExpiredVouchersList.css';

export default function ExpiredVouchersList({ vouchers }) {
  const [expanded, setExpanded] = useState(false);
  const locale = useLocale();
  const isAr = locale.startsWith('ar');

  if (!vouchers || vouchers.length === 0) return null;

  return (
    <section className="expired-vouchers-section">
      <button
        className="expired-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="material-symbols-sharp">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
        {isAr ? 'عروض منتهية (للإطلاع فقط)' : 'Recently expired offers (for reference)'}
        <span className="expired-count">({vouchers.length})</span>
      </button>
      {expanded && (
        <div className="expired-grid">
          {vouchers.map(voucher => (
            <div key={voucher.id} className="expired-item">
              <VoucherCard voucher={voucher} expired={true} />
            </div>
          ))}
          <p className="expired-note">
            {isAr
              ? 'هذه العروض منتهية الصلاحية. تحقق من العروض النشطة أعلاه لأحدث الخصومات.'
              : 'These offers have expired. Check active offers above for current discounts.'}
          </p>
        </div>
      )}
    </section>
  );
}
