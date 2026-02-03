// components/FeaturedProductsCarousel/FeaturedProductsCarousel.jsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import StoreProductCard from '../StoreProductCard/StoreProductCard';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import "./featured-products-carousel.css";

const FeaturedProductsCarousel = ({ 
  products = [], 
  storeName, 
  storeLogo,
  storeSlug 
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

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="featured-products-carousel" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="carousel-header">
        <h2 className="carousel-title">
          <span className="material-symbols-sharp">local_offer</span>
          {t('title', { default: "Today's Top Deals" })}
        </h2>
        <p className="carousel-subtitle">
          {t('presentedBy', { default: 'PRESENTED BY' })} {storeName.toUpperCase()}
        </p>
        
        {/* Featured Banner Link - Similar to Amazon's "10% CASH BACK" */}
        {storeSlug && (
          <Link href={`/${locale}/stores/${storeSlug}`} className="featured-banner-link">
            <span className="material-symbols-sharp">bolt</span>
            {t('viewAllDeals', { default: 'View all exclusive deals' })}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        )}
      </div>

      {/* View More Button */}
      {storeSlug && (
        <div className="view-more-container">
          <Link href={`/${locale}/stores/${storeSlug}`} className="view-more-btn">
            {t('viewMoreDeals', { default: 'View more deals' })}
          </Link>
        </div>
      )}
      
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

        {/* Navigation Buttons */}
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

      {/* Dot Indicators - Amazon style */}
      {scrollSnaps.length > 1 && (
        <div className="carousel-dots">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProductsCarousel;
