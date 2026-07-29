// components/ProductBadges/ProductBadges.jsx

// ============================================================================
// INDIVIDUAL BADGE COMPONENTS
// Each badge is independent and can be used separately
// ============================================================================

'use client';
import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import './Badges.css';

/**
 * Best Seller Badge Component
 * Shows when product is in top 10 of its category
 * 
 * @param {Number} rank - Category rank (1-10)
 */
export const BestSellerBadge = ({ rank }) => {
  const t = useTranslations('Badges');
  const locale = useLocale();
  
  if (!rank || rank > 10) return null;

  return (
    <div className="best_seller_badge_container">
      <div className="best_seller_badge">
        <span className="material-symbols-sharp">hotel_class</span>
        <span className="best_seller_badge_text">
          {rank === 1 ? t('bestSellerRank1') : t('bestSeller')}
        </span>
      </div>
    </div>
  );
};

/**
 * Trending Badge Component
 * Shows when product has high engagement (trending score > 0.7)
 * 
 * @param {Number} trendingScore - Score from 0-1
 */
export const TrendingBadge = ({ trendingScore }) => {
  const t = useTranslations('Badges');
  
  if (!trendingScore || trendingScore <= 0.7) return null;

  return (
    <div className="trending_badge_container">
      <div className="trending_badge">
        <span className="material-symbols-sharp">local_fire_department</span>
        <span className="trending_badge_text">{t('trending')}</span>
      </div>
    </div>
  );
};

/**
 * Price Drop Badge Component
 * Shows when price has dropped by 5% or more
 * 
 * @param {Array} priceHistory - Array of {price, date} objects
 */
export const PriceDropBadge = ({ priceHistory }) => {
  const t = useTranslations('Badges');
  
  if (!priceHistory || priceHistory.length < 2) return null;

  const currentPrice = priceHistory[0].price;
  const previousPrice = priceHistory[1].price;
  const dropPercent = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);

  if (dropPercent < 5) return null;

  // Determine severity class
  let severityClass = 'low';
  if (dropPercent >= 30) severityClass = 'high';
  else if (dropPercent >= 15) severityClass = 'medium';

  return (
    <div className={`price_drop_badge_container ${severityClass}`}>
      <div className="price_drop_badge">
        <span className="material-symbols-sharp">bolt</span>
        <span className="price_drop_badge_text">
          {t('priceDrop', { percent: dropPercent })}
        </span>
      </div>
    </div>
  );
};

/**
 * Limited Stock Badge Component
 * Shows when stock is below 10 items
 * 
 * @param {Number} stock - Current stock level
 */
export const LimitedStockBadge = ({ stock }) => {
  const t = useTranslations('Badges');
  
  if (!stock || stock >= 10) return null;

  return (
    <div className="limited_stock_badge_container">
      <div className="limited_stock_badge">
        <span className="material-symbols-sharp">priority_high</span>
        <span className="limited_stock_badge_text">
          {t('limitedStock', { count: stock })}
        </span>
      </div>
    </div>
  );
};

/**
 * Watching Now Badge Component
 * Shows how many users are currently viewing the product
 * 
 * @param {Number} count - Number of current viewers
 */
export const WatchingBadge = ({ count }) => {
  const t = useTranslations('Badges');
  
  if (!count || count <= 0) return null;

  // Round to nearest 100
  const roundedCount = Math.ceil(count / 100) * 100;

  return (
    <div className="watching_badge_container">
      <div className="watching_badge">
        <span className="material-symbols-sharp">visibility</span>
        <span className="watching_badge_text">
          {t('watching', { count: roundedCount })}
        </span>
      </div>
    </div>
  );
};

/**
 * Product Badges Manager Component
 * Manages which badges to show (max 2 top badges + watching badge)
 * Priority: Price Drop > Best Seller > Trending > Limited Stock
 * 
 * @param {Object} product - Product data
 * @param {Array} priceHistory - Price history
 * @param {Number} categoryRank - Category ranking
 * @param {Number} watchCount - Current viewers
 */
export const ProductBadges = ({ 
  product, 
  priceHistory, 
  categoryRank, 
  watchCount 
}) => {
  const locale = useLocale();
  const badges = [];

  // Calculate price drop
  let priceDropPercent = 0;
  if (priceHistory && priceHistory.length >= 2) {
    const currentPrice = priceHistory[0].price;
    const previousPrice = priceHistory[1].price;
    priceDropPercent = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
  }

  // Priority 1: Price Drop (if >= 5%)
  if (priceDropPercent >= 5) {
    badges.push({
      component: <PriceDropBadge key="price-drop" priceHistory={priceHistory} />,
      priority: 2
    });
  }

  // Priority 2: Best Seller (if rank <= 10)
  if (categoryRank && categoryRank <= 10) {
    badges.push({
      component: <BestSellerBadge key="best-seller" rank={categoryRank} />,
      priority: 1
    });
  }

  // Priority 3: Trending (if score > 0.7)
  if (product?.trendingScore > 0.7) {
    badges.push({
      component: <TrendingBadge key="trending" trendingScore={product.trendingScore} />,
      priority: 3
    });
  }

  // Priority 4: Limited Stock (if < 10)
  if (product?.stock > 0 && product?.stock < 10) {
    badges.push({
      component: <LimitedStockBadge key="limited-stock" stock={product.stock} />,
      priority: 4
    });
  }

  // Sort by priority and take top 1
  badges.sort((a, b) => a.priority - b.priority);
  const topBadges = badges.slice(0, 1);

  return (
    <>
      {/* Top Badges (max 1) */}
      <div className="product_badges_wrapper">
        {topBadges.map(badge => badge.component)}
      </div>
      
      {/* Watching Badge (always at bottom if data exists) */}
      {watchCount > 0 && (
        <WatchingBadge count={watchCount} />
      )}
    </>
  );
};

// Export all components
export default ProductBadges;
