// components/VouchersGrid/VouchersGrid.jsx - SIMPLIFIED
'use client';
import React from 'react';
import VoucherCard from '../VoucherCard/VoucherCard';
import { useLocale } from 'next-intl';
import "./VouchersGrid.css";

const VouchersGrid = ({ 
  vouchers, 
  emptyMessage,
  loading = false,
  hideStoreBranding = false
}) => {
  const locale = useLocale();

  if (loading) {
    return (
      <div className="vouchers-grid-container">
        <div className="vouchers-loading">
          <div className="loading-spinner"></div>
          <p>{locale === 'ar' ? 'جاري تحميل القسائم...' : 'Loading vouchers...'}</p>
        </div>
      </div>
    );
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="vouchers-grid-container">
        <div className="vouchers-empty-state">
          <span className="material-symbols-sharp">confirmation_number</span>
          <h3>{emptyMessage || (locale === 'ar' ? 'لا توجد كوبونات متاحة' : 'No vouchers available')}</h3>
          <p>
            {locale === 'ar' 
              ? 'تحقق مرة أخرى قريباً للحصول على عروض جديدة'
              : 'Check back soon for new deals'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vouchers-grid-container">
      <div className="vouchers-grid">
        {vouchers.map(voucher => (
          <div key={voucher.id} className="grid-item">
            <VoucherCard 
              voucher={voucher} 
              hideStoreBranding={hideStoreBranding}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VouchersGrid;