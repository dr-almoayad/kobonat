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
  // ── Single-store mode (store page) ──
  storeName,
  storeLogo,
  storeWebsiteUrl,
  lastUpdated,
  // ── Multi-store mode (homepage) ──
  // When true: header shows a generic title; each card reads its own store data.
  multiStore = false,
}) => {
  const t      = useTranslations('FeaturedProducts');
  const locale = useLocale();
  const isRtl  = locale.startsWith('ar');

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
  const [scrollSnaps, setScrollSnaps]     = useState([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

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

  // ── Last-updated label (single-store mode only) ──────────────────────────
  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    const diff = Math.floor((Date.now() - new Date(lastUpdated)) / 3600000);
    if (diff < 1)  return t('updatedJustNow',  { default: 'Updated just now' });
    if (diff < 24) return t('updatedHoursAgo', { default: 'Updated {hours}h ago', hours: diff });
    return t('updatedDaysAgo', { default: 'Updated {days}d ago', days: Math.floor(diff / 24) });
  };

  if (!products?.length) return null;

  // ── Header content varies by mode ────────────────────────────────────────
  const headerContent = multiStore ? (
    // Multi-store: generic homepage header
    <div className="carousel-header-top">
      <span className="material-symbols-sharp carousel-header-icon">
        auto_awesome
      </span>
      <div className="carousel-title-wrapper">
        <h2 className="carousel-title">
          {isRtl ? 'منتجات مميزة' : 'Featured Products'}
        </h2>
        <p className="carousel-last-updated">
          {isRtl
            ? 'أفضل المنتجات المختارة من متاجر متعددة'
            : 'Hand-picked deals from top stores'}
        </p>
      </div>
    </div>
  ) : (
    // Single-store: store logo + name + last updated
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
          <p className="carousel-last-updated">{formatLastUpdated()}</p>
        )}
      </div>
    </div>
  );

  return (
    <section className="featured-products-carousel" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="carousel-header">
        {headerContent}

        {/* CTA button — only in single-store mode */}
        {!multiStore && storeWebsiteUrl && (
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
                  // Single-store: pass shared store props.
                  // Multi-store: pass undefined — card falls back to product.storeName / product.storeLogo.
                  storeName={multiStore ? undefined : storeName}
                  storeLogo={multiStore ? undefined : storeLogo}
                />
              </div>
            ))}
          </div>
        </div>

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

      {scrollSnaps.length > 1 && (
        <div className="carousel-dots">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === selectedIndex ? 'active' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`${t('goToSlide', { default: 'Go to slide' })} ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProductsCarousel;
