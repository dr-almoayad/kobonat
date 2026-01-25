// components/FeaturedProductsCarousel/FeaturedProductsCarousel.jsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import StoreProductCard from '../StoreProductCard/StoreProductCard';
import { useTranslations, useLocale } from 'next-intl';
import "./featured-products-carousel.css";

const FeaturedProductsCarousel = ({ 
  products = [], // Accept products from server
  storeName, 
  storeLogo 
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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
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
          <span className="material-symbols-sharp">shopping_bag</span>
          {t('title')}
        </h2>
        <p className="carousel-subtitle">{t('subtitle')}</p>
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

        {canScrollPrev && (
          <button className="embla__button embla__button--prev" onClick={scrollPrev}>
            <span className={`material-symbols-sharp ${isRtl ? '' : 'flip-icon'}`}>
              arrow_back
            </span>
          </button>
        )}
        
        {canScrollNext && (
          <button className="embla__button embla__button--next" onClick={scrollNext}>
            <span className={`material-symbols-sharp ${isRtl ? 'flip-icon' : ''}`}>
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsCarousel;
