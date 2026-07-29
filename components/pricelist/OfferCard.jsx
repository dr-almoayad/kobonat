// components/pricelist/OfferCard.jsx
'use client';
import Image from "next/image";
import React from "react";
import { useTranslations, useLocale } from 'next-intl';
import "./OfferCard.css"; // Renamed CSS file

const OfferCard = ({ sellerProduct, sellerInfo, highlight = false }) => {
  const t = useTranslations('StoreCard');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  if (!sellerProduct || !sellerInfo) return null;

  // ── New comparison fields ──
  const { currentPrice, effectivePrice, savingsAmount, savingsPercent, stackingPath } = sellerProduct;
  const hasSavings = savingsPercent > 0;
  const priceToShow = hasSavings ? effectivePrice : currentPrice;

  const shippingCost = parseFloat(sellerProduct.shippingCost || 0);
  const isFreeShipping = shippingCost === 0;
  const totalPrice = priceToShow + shippingCost;

  // Payment Options
  const hasCOD = sellerProduct.cashOnDeliveryAvailable || false;
  const hasBNPL = sellerProduct.buyNowPayLaterAvailable || false;
  const monthlyPayment = hasBNPL ? (priceToShow / 4).toFixed(2) : null;

  // Delivery
  const deliveryTime = sellerProduct.deliveryTime || t('defaultDeliveryTime');
  const shipsFrom = sellerProduct.shipsFrom || sellerProduct.store?.name || t('notSpecified');

  // International
  const isInternational = sellerProduct.isInternational || false;
  const shipsFromCountry = sellerProduct.shipsFromCountry || null;
  const customsFees = parseFloat(sellerProduct.customsFeesEstimate || 0);
  const taxFees = parseFloat(sellerProduct.taxFeesEstimate || 0);
  const totalInternationalFees = customsFees + taxFees;

  // Return Policy
  const isReturnable = sellerProduct.isReturnable !== false;
  const returnWindowDays = sellerProduct.returnWindowDays || sellerProduct.store?.returnWindowDays || 14;

  const finalTotal = isInternational ? totalPrice + totalInternationalFees : totalPrice;

  // Payment methods – use static list for now
  const paymentMethods = ['visa', 'mastercard', 'paypal', 'amex'];

  return (
    <div
      className={`store-card-final ${highlight ? "highlight" : ""}`}
      data-badge={t('bestOffer')}
    >
      {/* Left Section - Store & Product Info */}
      <div className="store-main-info">
        {/* Store Header */}
        <div className="store-header-row">
          <Image
            src={sellerInfo.avatar || "/placeholder.png"}
            alt={sellerProduct.store.name}
            width={48}
            height={48}
            className="store-logo"
          />
          <a href="#" className="store-name-link">
            <span className="store-name">{sellerProduct.store.name}</span>
            <span className={`material-symbols-sharp ${isRtl ? 'flip-icon' : ''}`}>chevron_right</span>
          </a>
        </div>

        {/* Price Section - Shows effective price with savings */}
        <div className="price-display-compact">
          {hasSavings ? (
            <>
              <div className="effective-price">
                <span className="icon-saudi_riyal_new"></span>
                <span className="price-amount">{Math.floor(effectivePrice)}</span>
                <sup className="price-cents">{(effectivePrice % 1).toFixed(2).substring(1)}</sup>
              </div>
              <div className="original-price-strikethrough">
                <span className="icon-saudi_riyal_new"></span>
                {Math.floor(currentPrice)}.{(currentPrice % 1).toFixed(2).substring(1)}
              </div>
              <div className="savings-badge">
                {t('save', { amount: savingsAmount.toFixed(2), percent: Math.round(savingsPercent) })}
              </div>
              {stackingPath && (
                <div className="stacking-chip">
                  <span className="material-symbols-sharp">stacked_bar_chart</span>
                  {stackingPath}
                </div>
              )}
            </>
          ) : (
            <div className="current-price">
              <span className="icon-saudi_riyal_new"></span>
              <span className="price-amount">{Math.floor(priceToShow)}</span>
              <sup className="price-cents">{(priceToShow % 1).toFixed(2).substring(1)}</sup>
            </div>
          )}

          <div className={`shipping-info-compact ${isFreeShipping ? 'free' : ''}`}>
            {isFreeShipping ? (
              <div className="feature-badge shipping">
                <span className="material-symbols-sharp">delivery_truck_speed</span>
                <p>{t('freeShipping')}</p>
              </div>
            ) : (
              t('plusShipping', { price: shippingCost.toFixed(2) })
            )}
          </div>

          {hasBNPL && (
            <div className="bnpl-compact">
              {t('bnpl', { amount: monthlyPayment })}
            </div>
          )}
        </div>

        {/* Features Row */}
        <div className="features-row">
          {isFreeShipping && !highlight && (
            <div className="feature-badge shipping">
              <span className="material-symbols-sharp">delivery_truck_speed</span>
              <span>{t('freeShipping')}</span>
            </div>
          )}
          {hasCOD && (
            <div className="feature-badge cod">
              <span className="material-symbols-sharp">payments</span>
              <span>{t('cashOnDelivery')}</span>
            </div>
          )}
        </div>

        {/* Delivery Info Row */}
        <div className="delivery-info-row">
          <div className="delivery-item">
            <span className="material-symbols-sharp">schedule</span>
            <span>{t('delivery')}: <strong>{deliveryTime}</strong></span>
          </div>
          <div className="delivery-item">
            <span className="material-symbols-sharp">location_on</span>
            <span>
              {t.rich('shipsFrom', {
                location: () => <strong>{shipsFrom}</strong>
              })}
              {isInternational && shipsFromCountry && ` (${shipsFromCountry})`}
            </span>
          </div>
          {isReturnable ? (
            <div className="delivery-item">
              <span className="material-symbols-sharp">autorenew</span>
              <span>{t('returns')}: <strong>{t('days', { count: returnWindowDays })}</strong></span>
            </div>
          ) : (
            <div className="delivery-item">
              <span className="material-symbols-sharp">block</span>
              <span>{t('nonReturnable')}</span>
            </div>
          )}
        </div>

        {isInternational && totalInternationalFees > 0 && (
          <div className="delivery-info-row">
            <div className="delivery-item">
              <span className="material-symbols-sharp">info</span>
              <span>
                {t('importFees', {
                  customs: customsFees > 0 ? `$${customsFees.toFixed(2)}` : null,
                  tax: taxFees > 0 ? `$${taxFees.toFixed(2)}` : null
                })}
              </span>
            </div>
          </div>
        )}

        <div className="payment-methods-compact">
          <span className="payment-label-small">{t('paymentOptions')}:</span>
          <div className="payment-icons-row">
            {paymentMethods.includes('visa') && (
              <Image src="/payment/visa.png" alt="Visa" width={32} height={18} className="payment-icon-small" />
            )}
            {paymentMethods.includes('mastercard') && (
              <Image src="/payment/mastercard.png" alt="Mastercard" width={32} height={18} className="payment-icon-small" />
            )}
            {paymentMethods.includes('paypal') && (
              <Image src="/payment/pp.svg" alt="PayPal" width={32} height={18} className="payment-icon-small" />
            )}
            {paymentMethods.includes('amex') && (
              <Image src="/payment/amex.png" alt="Amex" width={32} height={18} className="payment-icon-small" />
            )}
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="cta-buttons-row">
        <button className="btn-go-to-store">
          <span>{t('goToStore')}</span>
          <span className={`material-symbols-sharp ${isRtl ? 'flip-icon' : ''}`}>arrow_forward</span>
        </button>
        {/* AddToCollectionButton removed – can be added later */}
      </div>
    </div>
  );
};

export default OfferCard;
