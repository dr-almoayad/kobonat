// components/FeaturedOffersCarousel.jsx
'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import './FeaturedOffersCarousel.css';

export default function FeaturedOffersCarousel({ title, countryCode = 'SA' }) {
  const locale = useLocale();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch(`/api/featured-offers?locale=${locale}&country=${countryCode}`);
        const data = await res.json();
        setOffers(data.offers || []);
      } catch (error) {
        console.error('Error fetching featured offers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [locale, countryCode]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? Math.max(0, offers.length - 4) : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev >= offers.length - 4 ? 0 : prev + 1));
  };

  const handleOfferClick = async (offer) => {
    // Track click
    try {
      await fetch('/api/featured-offers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id })
      });
    } catch (error) {
      console.error('Error tracking offer click:', error);
    }

    // Open URL
    if (offer.url) {
      window.open(offer.url, '_blank', 'noopener,noreferrer');
    }
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    const discount = originalPrice - price;
    const percentage = Math.round((discount / originalPrice) * 100);
    return { percentage, absolute: discount };
  };

  if (loading) {
    return (
      <div className="featured-offers-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!offers.length) {
    return null;
  }

  return (
    <section className="featured-offers-carousel">
      <div className="container">
        <div className="carousel-header">
          <h2 className="carousel-title">{title}</h2>
          <div className="carousel-controls">
            <button 
              className="control-btn prev" 
              onClick={handlePrev}
              disabled={currentSlide === 0}
              aria-label="Previous"
            >
              <span className="material-symbols-sharp">chevron_left</span>
            </button>
            <button 
              className="control-btn next" 
              onClick={handleNext}
              disabled={currentSlide >= offers.length - 4}
              aria-label="Next"
            >
              <span className="material-symbols-sharp">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="carousel-track-container">
          <div 
            className="carousel-track" 
            style={{ transform: `translateX(-${currentSlide * 25}%)` }}
          >
            {offers.map((offer) => {
              const discount = calculateDiscount(offer.price, offer.originalPrice);
              
              return (
                <div 
                  key={offer.id} 
                  className="offer-card"
                  onClick={() => handleOfferClick(offer)}
                >
                  <div className="offer-image-container">
                    <img 
                      src={offer.image} 
                      alt={offer.title}
                      className="offer-image"
                      loading="lazy"
                    />
                    
                    {discount && (
                      <div className="discount-badge">
                        {discount.percentage}%
                      </div>
                    )}

                    <div className="offer-overlay">
                      <div className="offer-info">
                        <h3 className="offer-title">{offer.title}</h3>
                        
                        <div className="offer-pricing">
                          <div className="current-price">
                            {offer.currency} {offer.price.toFixed(2)}
                          </div>
                          
                          {offer.originalPrice && offer.originalPrice > offer.price && (
                            <div className="original-price">
                              {offer.currency} {offer.originalPrice.toFixed(2)}
                            </div>
                          )}
                        </div>

                        {discount && discount.absolute > 0 && (
                          <div className="savings-badge">
                            {locale.startsWith('ar') ? 'وفر' : 'Save'} {offer.currency} {discount.absolute.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {offer.expiryDate && (
                    <div className="offer-expiry">
                      <span className="material-symbols-sharp">schedule</span>
                      {locale.startsWith('ar') ? 'ينتهي' : 'Expires'}: {new Date(offer.expiryDate).toLocaleDateString(locale)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="mobile-scroll-indicator">
          {offers.map((_, index) => (
            <div 
              key={index}
              className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
