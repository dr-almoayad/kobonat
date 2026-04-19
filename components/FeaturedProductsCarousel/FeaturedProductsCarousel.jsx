"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import StoreProductCard from '../StoreProductCard/StoreProductCard';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import "./featured-products-carousel.css";

/**
 * Builds stacked store avatars for multi-store mode.
 * Sorted by featuredCount desc, then store name A→Z for ties.
 * Shows up to `max` overlapping circles.
 */
function StackedStoreAvatars({ stores = [], max = 4 }) {
  const sorted = [...stores]
    .sort((a, b) =>
      b.featuredCount - a.featuredCount ||
      (a.name || '').localeCompare(b.name || '')
    )
    .slice(0, max);

  if (!sorted.length) return null;

  return (
    <div className="fpc-avatar-stack" aria-hidden="true">
      {sorted.map((store, i) => (
        <div
          key={store.id ?? i}
          className="fpc-avatar"
          title={store.name}
          style={{ zIndex: sorted.length - i }}
        >
          {store.logo ? (
            <Image
              src={store.logo}
              alt={store.name || ''}
              width={36}
              height={36}
              className="fpc-avatar-img"
              unoptimized
            />
          ) : (
            <span className="fpc-avatar-fallback">
              {(store.name || '?')[0].toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {stores.length > max && (
        <div className="fpc-avatar fpc-avatar-more">
          +{stores.length - max}
        </div>
      )}
    </div>
  );
}

const FeaturedProductsCarousel = ({
  products = [],
  // Single-store mode
  storeName,
  storeLogo,
  storeWebsiteUrl,
  lastUpdated,
  // Multi-store mode
  multiStore = false,
  stores = [],   // [{ id, name, logo, featuredCount }]
}) => {
  const t      = useTranslations('FeaturedProducts');
  const locale = useLocale();
  const isRtl  = locale?.startsWith('ar') ?? false;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align:          'start',
    containScroll:  'trimSnaps',
    dragFree:       false,
    slidesToScroll: 1,
    direction:      isRtl ? 'rtl' : 'ltr',
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

  if (!products?.length) return null;

  // ── Header ──────────────────────────────────────────────────────────────
  const headerLeft = multiStore ? (
    /* Multi-store: stacked avatars + generic title */
    <div className="fpc-header-left">
      <StackedStoreAvatars stores={stores} max={4} />
      <div className="fpc-title-block">
        <h2 className="fpc-title">
          {isRtl
            ? 'منتجات مميزة اليوم'
            : "Today's Top Deals"}
        </h2>
        {stores.length > 0 && (
          <p className="fpc-subtitle">
            {isRtl
              ? `من ${stores.length} متجر`
              : `FROM ${stores.map(s => (s.name || '').toUpperCase()).slice(0, 2).join(' & ')}${stores.length > 2 ? ' & MORE' : ''}`}
          </p>
        )}
      </div>
    </div>
  ) : (
    /* Single-store: one logo + store name */
    <div className="fpc-header-left">
      {storeLogo ? (
        <div className="fpc-single-logo-wrap">
          <Image
            src={storeLogo}
            alt={storeName || ''}
            width={48}
            height={48}
            className="fpc-single-logo"
            unoptimized
          />
        </div>
      ) : null}
      <div className="fpc-title-block">
        <h2 className="fpc-title">
          {isRtl ? 'عروض اليوم المميزة' : "Today's Top Deals"}
        </h2>
        {storeName && (
          <p className="fpc-subtitle">
            {isRtl
              ? `مقدمة من ${storeName.toUpperCase()}`
              : `PRESENTED BY ${storeName.toUpperCase()}`}
          </p>
        )}
      </div>
    </div>
  );

  const ctaHref = multiStore
    ? null
    : (storeWebsiteUrl || null);

  return (
    <section
      className="fpc-section"
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-label={isRtl ? 'منتجات مميزة' : 'Featured products'}
    >
      {/* Header row */}
      <div className="fpc-header">
        {headerLeft}

        {ctaHref && (
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="fpc-view-more"
          >
            {isRtl ? 'عرض المزيد' : 'View more deals'}
          </a>
        )}
      </div>

      {/* Divider */}
      <div className="fpc-divider" />

      {/* Carousel */}
      <div className="fpc-embla">
        <div className="fpc-embla__viewport" ref={emblaRef}>
          <div className="fpc-embla__container">
            {products.map((product) => (
              <div key={product.id} className="fpc-embla__slide">
                <StoreProductCard
                  product={product}
                  storeName={multiStore ? product.storeName : storeName}
                  storeLogo={multiStore ? product.storeLogo : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          className="fpc-arrow fpc-arrow--prev"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label={isRtl ? 'التالي' : 'Previous'}
        >
          <span className="material-symbols-sharp">
            {isRtl ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        <button
          className="fpc-arrow fpc-arrow--next"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label={isRtl ? 'السابق' : 'Next'}
        >
          <span className="material-symbols-sharp">
            {isRtl ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </div>

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="fpc-dots" role="tablist" aria-label="Slides">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === selectedIndex}
              className={`fpc-dot${i === selectedIndex ? ' fpc-dot--active' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProductsCarousel;
