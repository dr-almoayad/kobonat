// components/StoreProductCard/StoreProductCard.jsx - SIMPLIFIED FOR COUPONS PLATFORM
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './StoreProductCard.css';

const StoreProductCard = ({ product, storeName, storeLogo }) => {
  const t = useTranslations('StoreProductCard');
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');
  
  const [isClicked, setIsClicked] = useState(false);

  // Track click and redirect
  const handleClick = async (e) => {
    e.preventDefault();
    
    if (isClicked) return;
    setIsClicked(true);

    // Track click analytics
    try {
      await fetch('/api/store-products/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }

    // Redirect to store product page
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  // Calculate discount percentage
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <article className="store-product-card" onClick={handleClick}>
      {/* Product Image */}
      <div className="product-image-wrapper">
        <Image
          src={product.image}
          alt={product.title}
          width={300}
          height={300}
          className="product-image"
        />

        {/* Store Logo (small) */}
        {storeLogo && (
          <div className="store-badge">
            <Image
              src={storeLogo}
              alt={storeName}
              width={100}
              height={100}
              className="store-logo-mini"
            />
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="discount-badge">
            <span className="percentage">-{discountPercentage}%</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">

        {/* Title */}
        <h3 className="product-title">{product.title}</h3>

        {/* Pricing */}
        <div className="product-pricing">
          <div className="current-price">
            <span className="currency">
              <span className="icon-saudi_riyal_new"></span>
            </span>
            <span className="amount">
              {Math.floor(product.price)}
            </span>
            <sup className="cents">
              {(product.price % 1).toFixed(2).substring(1)}
            </sup>
          </div>

          {product.originalPrice && (
            <div className="original-price">
              <span className="icon-saudi_riyal_new"></span>
              {product.originalPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button 
          className={`shop-now-btn ${isClicked ? 'clicked' : ''}`}
          disabled={isClicked}
        >
          <span>{t('shopNow')}</span>
          <span className={`material-symbols-sharp ${isRtl ? 'flip-icon' : ''}`}>
            arrow_outward
          </span>
        </button>
      </div>
    </article>
  );
};

export default StoreProductCard;
