// components/OtherPromosSection/OtherPromosSection.jsx - WITH SEO ANCHOR LINKS
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './other-promos.css';

const OtherPromosSection = ({ storeSlug, storeName }) => {
  const t = useTranslations('OtherPromos');
  const locale = useLocale();
  const [language, countryCode] = locale.split('-');
  
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch(
          `/api/stores/${storeSlug}/other-promos?locale=${language}&country=${countryCode}`
        );
        
        if (res.ok) {
          const data = await res.json();
          setPromos(data.promos || []);
        }
      } catch (error) {
        console.error('Failed to fetch other promos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, [storeSlug, language, countryCode]);

  // ✅ Generate SEO-friendly anchor ID
  const generatePromoId = (promo) => {
    const title = promo.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single
      .trim();
    
    return `promo-${promo.id}-${title.substring(0, 50)}`; // Limit length
  };

  // ✅ Copy anchor link to clipboard
  const copyPromoLink = async (promoId) => {
    const url = `${window.location.origin}${window.location.pathname}#${promoId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(promoId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="other-promos-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-cards">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  if (promos.length === 0) return null;

  return (
    <section className="other-promos-section" id="other-offers">
      {/* ✅ Section Header with Anchor */}
      <div className="section-header">
        <h2 className="section-title">
          <span className="material-symbols-sharp">local_activity</span>
          {t('title')}
        </h2>
        
        {/* Optional: Quick Navigation */}
        {promos.length > 3 && (
          <div className="promo-quick-nav">
            {promos.map((promo) => {
              const promoId = generatePromoId(promo);
              return (
                <a 
                  key={promoId} 
                  href={`#${promoId}`}
                  className="quick-nav-link"
                  title={promo.title}
                >
                  {getPromoIcon(promo.type)}
                </a>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="promos-grid">
        {promos.map((promo) => {
          const promoId = generatePromoId(promo);
          
          return (
            <article 
              key={promo.id} 
              id={promoId}  // ✅ Anchor ID
              className={`promo-card ${promo.type.toLowerCase()}`}
              itemScope 
              itemType="https://schema.org/Offer"
            >
              {/* ✅ Share Button */}
              <button
                className="share-promo-btn"
                onClick={() => copyPromoLink(promoId)}
                aria-label={t('shareOffer', { default: 'Share this offer' })}
                title={copiedId === promoId ? t('linkCopied', { default: 'Link copied!' }) : t('copyLink', { default: 'Copy link' })}
              >
                <span className="material-symbols-sharp">
                  {copiedId === promoId ? 'check' : 'link'}
                </span>
              </button>

              {/* Promo Image */}
              {promo.image && (
                <div className="promo-image">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    width={400}
                    height={180}
                    className="img"
                    itemProp="image"
                  />
                </div>
              )}

              {/* Content */}
              <div className="promo-content">
                <h3 className="promo-title" itemProp="name">
                  {promo.title}
                </h3>
                
                {promo.description && (
                  <p className="promo-description" itemProp="description">
                    {promo.description}
                  </p>
                )}

                {/* Metadata for schema.org */}
                <meta itemProp="seller" content={storeName} />
                {promo.expiryDate && (
                  <meta itemProp="validThrough" content={promo.expiryDate} />
                )}

                {/* Expiry */}
                {promo.expiryDate && (
                  <p className="promo-expiry">
                    <span className="material-symbols-sharp">schedule</span>
                    {t('validUntil', { 
                      date: new Date(promo.expiryDate).toLocaleDateString(locale) 
                    })}
                  </p>
                )}

                {/* CTA */}
                {promo.url && (
                  <a 
                    href={promo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="promo-link"
                    itemProp="url"
                  >
                    {t('goToStore')}
                    <span className="material-symbols-sharp">arrow_outward</span>
                  </a>
                )}
              </div>

              {/* T&Cs Accordion */}
              {promo.terms && (
                <details className="promo-terms">
                  <summary>{t('termsAndConditions')}</summary>
                  <p>{promo.terms}</p>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

// Helper: Get icon for promo type
function getPromoIcon(type) {
  const icons = {
    BANK_OFFER: 'account_balance',
    CARD_OFFER: 'credit_card',
    PAYMENT_OFFER: 'payments',
    SEASONAL: 'celebration',
    BUNDLE: 'redeem',
    OTHER: 'local_offer'
  };
  
  return (
    <span className="material-symbols-sharp">
      {icons[type] || icons.OTHER}
    </span>
  );
}

export default OtherPromosSection;
