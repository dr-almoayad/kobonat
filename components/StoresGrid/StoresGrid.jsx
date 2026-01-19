// components/StoresGrid/StoresGrid.jsx - UPDATED
'use client';
import React from 'react';
import StoreCard from '../StoreCard/StoreCard'; // Assuming you have a StoreCard component
import { useTranslations } from 'next-intl';
import "./StoresGrid.css";

const StoresGrid = ({ 
  stores, 
  loading = false,
  emptyMessage,
  locale
}) => {
  const t = useTranslations('StoresGrid');

  if (loading) {
    return (
      <div className="stores_grid_container">
        <div className="stores_grid_loading">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="stores_grid_container">
        <div className="stores_grid_empty">
          <span className="material-symbols-sharp">store</span>
          <p>{emptyMessage || t('noStores')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stores_grid_container">
      <div className="stores_grid">
        {stores.map(store => (
          <StoreCard 
            key={store.id} 
            store={store} 
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

export default StoresGrid;