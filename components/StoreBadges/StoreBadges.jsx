// components/StoreBadges/StoreBadges.jsx
'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import './StoreBadges.css';

/**
 * Best Offer Badge - For the highlighted store with lowest price
 * Shows prominently with savings information
 */
export const BestOfferBadge = ({ savingsAmount, savingsPercent, currentPrice }) => {
  const t = useTranslations('StoreBadges');
  
  // Determine whether to show cash or percentage based on value
  const showCash = savingsAmount > 100 || (savingsAmount > 50 && currentPrice > 1000);
  const displayValue = showCash 
    ? `${Math.round(savingsAmount)} ${t('currency')}`
    : `${Math.round(savingsPercent)}%`;
  
  return (
    <div className="store_best_offer_badge_container">
      <div className="store_best_offer_badge">
        <span className="material-symbols-sharp">workspace_premium</span>
        <span className="store_best_offer_badge_text">
          {t('bestOffer')}
        </span>
      </div>
      
      {/* Savings sub-badge */}
      {(savingsAmount > 0 || savingsPercent > 0) && (
        <div className="store_savings_subbadge">
          <span className="store_savings_text">
            {t('save')} {displayValue}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Fast Delivery Badge - For same-day or next-day delivery
 */
export const FastDeliveryBadge = ({ deliveryDays }) => {
  const t = useTranslations('StoreBadges');
  
  return (
    <div className="store_fast_delivery_badge">
      <span className="material-symbols-sharp">bolt</span>
      <span className="store_fast_delivery_badge_text">
        {deliveryDays === 0 ? t('sameDay') : t('getTomorrow')}
      </span>
    </div>
  );
};

/**
 * Premium Service Badge - For extended warranty, premium support, etc.
 */
export const PremiumServiceBadge = ({ serviceType }) => {
  const t = useTranslations('StoreBadges');
  
  return (
    <div className="store_premium_badge">
      <span className="material-symbols-sharp">shield_check</span>
      <span className="store_premium_badge_text">
        {serviceType === 'warranty' ? t('extendedWarranty') : t('premiumSupport')}
      </span>
    </div>
  );
};

/**
 * Free Returns Badge - For generous return policies (30+ days)
 */
export const FreeReturnsBadge = ({ returnDays }) => {
  const t = useTranslations('StoreBadges');
  
  return (
    <div className="store_free_returns_badge">
      <span className="material-symbols-sharp">sync</span>
      <span className="store_free_returns_badge_text">
        {returnDays >= 60 ? t('freeReturns60') : t('freeReturns30')}
      </span>
    </div>
  );
};

/**
 * Verified Seller Badge - For official/authorized sellers
 */
export const VerifiedSellerBadge = () => {
  const t = useTranslations('StoreBadges');
  
  return (
    <div className="store_verified_badge">
      <span className="material-symbols-sharp">verified</span>
      <span className="store_verified_badge_text">
        {t('officialSeller')}
      </span>
    </div>
  );
};

/**
 * Price Guarantee Badge - For stores offering price matching
 */
export const PriceGuaranteeBadge = () => {
  const t = useTranslations('StoreBadges');
  
  return (
    <div className="store_price_guarantee_badge">
      <span className="material-symbols-sharp">check_circle</span>
      <span className="store_price_guarantee_badge_text">
        {t('priceMatch')}
      </span>
    </div>
  );
};

/**
 * Analyze store features and determine badge priority
 */
const analyzeStoreFeatures = (sellerProduct, sellerInfo, isHighlighted, allOffers) => {
  const features = {
    isBestOffer: false,
    savingsAmount: 0,
    savingsPercent: 0,
    hasFastDelivery: false,
    deliveryDays: null,
    hasPremiumService: false,
    serviceType: null,
    hasGenerousReturns: false,
    returnDays: 0,
    isVerifiedSeller: false,
    hasPriceGuarantee: false
  };
  
  // Check if this is the best offer
  if (isHighlighted && allOffers && allOffers.length > 1) {
    features.isBestOffer = true;
    
    // Calculate savings compared to second-best offer
    const sortedOffers = [...allOffers].sort((a, b) => 
      parseFloat(a.price) - parseFloat(b.price)
    );
    
    if (sortedOffers.length >= 2) {
      const currentPrice = parseFloat(sellerProduct.price);
      const secondBestPrice = parseFloat(sortedOffers[1].price);
      
      features.savingsAmount = secondBestPrice - currentPrice;
      features.savingsPercent = ((secondBestPrice - currentPrice) / secondBestPrice) * 100;
    }
  }
  
  // Check delivery speed
  const deliveryTime = sellerProduct.deliveryTime || '';
  if (deliveryTime.toLowerCase().includes('same day') || 
      deliveryTime.toLowerCase().includes('today') ||
      deliveryTime === '0') {
    features.hasFastDelivery = true;
    features.deliveryDays = 0;
  } else if (deliveryTime.toLowerCase().includes('tomorrow') || 
             deliveryTime.toLowerCase().includes('next day') ||
             deliveryTime === '1' ||
             deliveryTime.includes('1 day')) {
    features.hasFastDelivery = true;
    features.deliveryDays = 1;
  }
  
  // Check premium services (you can add these fields to your schema)
  if (sellerInfo.hasExtendedWarranty || sellerProduct.warranty) {
    features.hasPremiumService = true;
    features.serviceType = 'warranty';
  } else if (sellerInfo.hasPremiumSupport || sellerInfo.has24Support) {
    features.hasPremiumService = true;
    features.serviceType = 'support';
  }
  
  // Check return policy
  const returnDays = sellerProduct.returnWindowDays || sellerInfo.returnWindowDays || 0;
  if (returnDays >= 30 && sellerProduct.isReturnable !== false) {
    features.hasGenerousReturns = true;
    features.returnDays = returnDays;
  }
  
  // Check if verified/official seller
  if (sellerInfo.isOfficialSeller || sellerInfo.isVerified || sellerInfo.isTrusted) {
    features.isVerifiedSeller = true;
  }
  
  // Check price guarantee
  if (sellerInfo.hasPriceGuarantee || sellerInfo.priceMatch) {
    features.hasPriceGuarantee = true;
  }
  
  return features;
};

/**
 * Store Badges Manager Component
 * Automatically selects and displays the most relevant badge for a store offer
 * 
 * Priority:
 * 1. Best Offer (if highlighted)
 * 2. Fast Delivery (same/next day)
 * 3. Premium Service (warranty/support)
 * 4. Generous Returns (30+ days)
 * 5. Verified Seller
 * 6. Price Guarantee
 */
export const StoreBadges = ({ 
  sellerProduct, 
  sellerInfo, 
  isHighlighted = false,
  allOffers = null
}) => {
  if (!sellerProduct || !sellerInfo) return null;
  
  // Analyze store features
  const features = analyzeStoreFeatures(sellerProduct, sellerInfo, isHighlighted, allOffers);
  
  // Select primary badge based on priority
  let primaryBadge = null;
  
  if (features.isBestOffer && (features.savingsAmount > 0 || features.savingsPercent > 0)) {
    primaryBadge = (
      <BestOfferBadge 
        key="best-offer"
        savingsAmount={features.savingsAmount}
        savingsPercent={features.savingsPercent}
        currentPrice={parseFloat(sellerProduct.price)}
      />
    );
  } else if (features.hasFastDelivery) {
    primaryBadge = (
      <FastDeliveryBadge 
        key="fast-delivery"
        deliveryDays={features.deliveryDays}
      />
    );
  } else if (features.hasPremiumService) {
    primaryBadge = (
      <PremiumServiceBadge 
        key="premium-service"
        serviceType={features.serviceType}
      />
    );
  } else if (features.hasGenerousReturns) {
    primaryBadge = (
      <FreeReturnsBadge 
        key="free-returns"
        returnDays={features.returnDays}
      />
    );
  } else if (features.isVerifiedSeller) {
    primaryBadge = <VerifiedSellerBadge key="verified-seller" />;
  } else if (features.hasPriceGuarantee) {
    primaryBadge = <PriceGuaranteeBadge key="price-guarantee" />;
  }
  
  return (
    <>
      {primaryBadge && (
        <div className="store_badges_wrapper">
          {primaryBadge}
        </div>
      )}
    </>
  );
};

export default StoreBadges;