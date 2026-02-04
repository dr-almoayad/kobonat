// components/FeaturedProductsCarousel/FeaturedProductsCarousel.jsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import StoreProductCard from '../StoreProductCard/StoreProductCard';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import "./featured-products-carousel.css";

const FeaturedProductsCarousel = ({ 
  products = [], 
  storeName, 
  storeLogo,
  storeWebsiteUrl,
  lastUpdated 
}) => {
  const t = useTranslations('FeaturedProducts');
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
    direction: isRtl ? 'rtl' : 'ltr',
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Format last updated date
  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    
    const date = new Date(lastUpdated);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return t('updatedJustNow', { default: 'Updated just now' });
    } else if (diffHours < 24) {
      return t('updatedHoursAgo', { default: 'Updated {hours}h ago', hours: diffHours });
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return t('updatedDaysAgo', { default: 'Updated {days}d ago', days: diffDays });
    }
  };

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="featured-products-carousel" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="carousel-header">
        <div className="carousel-header-top">
          {storeLogo && (
            <Image
              src={storeLogo}
              alt={`${storeName} logo`}
              width={64}
              height={64}
              className="carousel-store-logo"
            />
          )}
          <div className="carousel-title-wrapper">
            <h2 className="carousel-title">
              {t('topOffersFrom', { default: 'Top offers from' })}{' '}
              <span className="carousel-store-name">{storeName}</span>
            </h2>
            {lastUpdated && (
              <p className="carousel-last-updated">
                {formatLastUpdated()}
              </p>
            )}
          </div>
        </div>

        {storeWebsiteUrl && (
          <a 
            href={storeWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="view-more-btn"
          >
            {t('viewMoreOffers', { default: 'View more offers' })}
            <span className="material-symbols-sharp">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </a>
        )}
      </div>
      
      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {products.map((product) => (
              <div key={product.id} className="embla__slide">
                <StoreProductCard 
                  product={product}
                  storeName={storeName}
                  storeLogo={storeLogo}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons - Desktop Only */}
        {canScrollPrev && (
          <button 
            className="embla__button embla__button--prev" 
            onClick={scrollPrev}
            aria-label={t('previousSlide', { default: 'Previous' })}
          >
            <span className="material-symbols-sharp">
              {isRtl ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
        )}
        
        {canScrollNext && (
          <button 
            className="embla__button embla__button--next" 
            onClick={scrollNext}
            aria-label={t('nextSlide', { default: 'Next' })}
          >
            <span className="material-symbols-sharp">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>
        )}
      </div>

      {/* Dot Indicators */}
      {scrollSnaps.length > 1 && (
        <div className="carousel-dots">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => scrollTo(index)}
              aria-label={`${t('goToSlide', { default: 'Go to slide' })} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProductsCarousel
