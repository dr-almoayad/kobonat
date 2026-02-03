// components/StoreProductCard/StoreProductCard.jsx - UPDATED WITH DEBUGGING
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './StoreProductCard.css';

const StoreProductCard = ({ product, storeName, storeLogo }) => {
  const t = useTranslations('StoreProductCard');
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');
  
  const [isClicked, setIsClicked] = useState(false);
  const [discountDisplay, setDiscountDisplay] = useState(null);

  // Format discount display - FIXED VERSION
  useEffect(() => {
    // Debug log
    console.log('Product data:', product);
    
    if (!product) {
      setDiscountDisplay(null);
      return;
    }

    const { discountValue, discountType } = product;
    
    // Check if discountValue exists and is greater than 0
    if (discountValue === null || discountValue === undefined || discountValue <= 0) {
      console.log('No valid discount:', discountValue);
      setDiscountDisplay(null);
      return;
    }

    const value = Math.round(discountValue);
    const offText = t('off') || 'OFF';
    
    let display = '';
    if (discountType === 'PERCENTAGE') {
      display = `${value}% ${offText}`;
    } else if (discountType === 'ABSOLUTE') {
      display = `${value} SAR ${offText}`;
    } else {
      // Fallback for any other type
      display = `${value} ${offText}`;
    }
    
    console.log('Discount display set to:', display);
    setDiscountDisplay(display);
  }, [product, t]);

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
              alt={storeName || 'Store'}
              width={60}
              height={20}
              className="store-logo-mini"
            />
          </div>
        )}

        {/* Product Image */}
        <Image
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title || 'Product'}
          width={280}
          height={280}
          className="product-image"
        />
      </div>

      {/* Product Info Section */}
      <div className="product-info">
        {/* Product Title */}
        <h3 className="product-title">{product.title || 'Product Title'}</h3>

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
