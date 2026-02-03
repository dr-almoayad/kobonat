// components/StoreProductCard/StoreProductCard.jsx - UPDATED WITH DISCOUNT
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

  // Format discount display
  const getDiscountDisplay = () => {
  // Ensure we have a valid number greater than 0
  if (product.discountValue === null || product.discountValue <= 0) return null;
  
  const value = Math.round(product.discountValue);
  
  // Use a fallback string if the translation is missing
  const offText = t('off') || 'OFF'; 
  
  if (product.discountType === 'PERCENTAGE') {
    return `${value}% ${offText}`;
  } else {
    return `${value} SAR ${offText}`;
  }
};

  const discountDisplay = getDiscountDisplay();

  return (
    <article className="store-product-card" onClick={handleClick}>
      {/* Product Image Container */}
      <div className="product-image-wrapper">
        {/* Discount Badge - Top Left (Amazon style) */}
        {discountDisplay && (
          <div className="discount-badge">
            {discountDisplay}
          </div>
        )}

        {/* Store Badge - Top Right (Sponsored style) */}
        {storeLogo && (
          <div className="store-badge">
            <Image
              src={storeLogo}
              alt={storeName}
              width={60}
              height={20}
              className="store-logo-mini"
            />
          </div>
        )}

        {/* Product Image */}
        <Image
          src={product.image}
          alt={product.title}
          width={280}
          height={280}
          className="product-image"
        />
      </div>

      {/* Product Info Section */}
      <div className="product-info">
        {/* Product Title */}
        <h3 className="product-title">{product.title}</h3>

        {/* Optional: Savings Text */}
        {discountDisplay && (
          <div className="savings-text">
            {t('save', { default: 'Save' })} {discountDisplay}
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreProductCard;
