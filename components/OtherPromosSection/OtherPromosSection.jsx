// components/OtherPromosSection/OtherPromosSection.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './other-promos.css';

const OtherPromosSection = ({ storeSlug }) => {
  const t = useTranslations('OtherPromos');
  const locale = useLocale();
  const [language, countryCode] = locale.split('-');
  
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Move the guard INSIDE the useEffect
    if (!locale || !locale.includes('-')) return;

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
  }, [storeSlug, language, countryCode, locale]);

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
    <section className="other-promos-section">
      <h2 className="section-title">
        <span className="material-symbols-sharp">local_activity</span>
        {t('title')}
      </h2>
      
      <div className="promos-grid">
        {promos.map((promo) => (
          <div key={promo.id} className={`promo-card ${promo.type.toLowerCase()}`}>
            {promo.image && (
              <div className="promo-image">
                <Image
                  src={promo.image}
                  alt={promo.title}
                  width={400}
                  height={180}
                  className="img"
                />
              </div>
            )}
            <div className="promo-content">
              <h3 className="promo-title">{promo.title}</h3>
              {promo.description && <p className="promo-description">{promo.description}</p>}
              {promo.expiryDate && (
                <p className="promo-expiry">
                  <span className="material-symbols-sharp">schedule</span>
                  {t('validUntil', { 
                    date: new Date(promo.expiryDate).toLocaleDateString(locale) 
                  })}
                </p>
              )}
              {promo.url && (
                <a href={promo.url} target="_blank" rel="noopener noreferrer" className="promo-link">
                  {t('goToStore')}
                  <span className="material-symbols-sharp">arrow_outward</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OtherPromosSection;
