// components/StoreProductCard/StoreProductCard.jsx - FIXED VERSION
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

  // Format discount display
  useEffect(() => {
    if (!product) {
      setDiscountDisplay(null);
      return;
    }

    const { discountValue, discountType } = product;
    
    // Check if discountValue exists and is greater than 0
    if (discountValue === null || discountValue === undefined || discountValue <= 0) {
      setDiscountDisplay(null);
      return;
    }

    const value = Math.round(discountValue);
    
    let display = '';
    if (discountType === 'PERCENTAGE') {
      display = `${value}%`;
    } else if (discountType === 'ABSOLUTE') {
      display = `${value} SAR`;
    } else {
      display = `${value}`;
    }
    
    setDiscountDisplay(display);
  }, [product]);

  // Track click and redirect
  const handleClick = async (e) => {
    e.preventDefault();
    
    if (isClicked || !product?.productUrl) return;
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

  // Handle missing data gracefully
  if (!product) {
    return null;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <article 
      className="store-product-card" 
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${product.title || 'Product'} - ${storeName}`}
    >
      {/* Product Image Container */}
      <div className="product-image-wrapper">
        {/* Store Badge - Top Left */}
        {storeLogo && (
          <div className="store-badge">
            <Image
              src={storeLogo}
              alt={storeName || 'Store'}
              width={80}
              height={24}
              className="store-logo-mini"
              unoptimized
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
          priority={false}
          unoptimized
        />

        {/* Discount Badge - Bottom (Ribbon Style) */}
        {discountDisplay && (
          <div className="discount-badge" aria-label={`${t('discount', { default: 'Discount' })} ${discountDisplay}`}>
            {t('off', { default: 'OFF' })} {discountDisplay}
          </div>
        )}
      </div>
      
      {/* Product Info Section */}
      <div className="product-info">
        {/* Product Title */}
        <h3 className="product-title">
          {product.title || t('untitled', { default: 'Product' })}
        </h3>

        {/* Store Name */}
        <p className="product-store">
          {t('soldBy', { default: 'Sold by' })} {storeName}
        </p>

        {/* Savings Text (CTA) */}
        {discountDisplay && (
          <div className="savings-text">
            <span className="material-symbols-sharp" aria-hidden="true">
              local_offer
            </span>
            <h6>
              {t('save', { default: 'Save' })} {discountDisplay}
            </h6>
            <span className="material-symbols-sharp" aria-hidden="true">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreProductCard;
