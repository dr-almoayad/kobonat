// components/StoreProductCard/StoreProductCard.jsx - AMAZON STYLE
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

  // Split price into whole and decimal parts
  const priceWhole = Math.floor(product.price);
  const priceCents = Math.round((product.price % 1) * 100);

  return (
    <article className="store-product-card" onClick={handleClick}>
      {/* Product Image Container */}
      <div className="product-image-wrapper">
        {/* Discount Badge - Top Left (Amazon style) */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="discount-badge">
            {discountPercentage}% {t('off', { default: 'OFF' })}
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
        {discountPercentage && (
          <div className="savings-text">
            {t('save', { default: 'Save' })} {discountPercentage}%
          </div>
        )}

        {/* Optional: Delivery Info */}
        <div className="delivery-info">
          {t('freeDelivery', { default: 'FREE delivery' })}
        </div>

        {/* Shop Now Button - Amazon Yellow */}
        <button 
          className={`shop-now-btn ${isClicked ? 'clicked' : ''}`}
          disabled={isClicked}
        >
          {isClicked ? (
            <>
              <span className="material-symbols-sharp">check_circle</span>
              <span>{t('opening', { default: 'Opening...' })}</span>
            </>
          ) : (
            <>
              <span>{t('checkPrice', { default: 'Check price' })}</span>
              <span className="material-symbols-sharp">
                arrow_outward
              </span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default StoreProductCard;
