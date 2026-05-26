"use client";
import React from "react";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import StoreProductCard from "../StoreProductCard/StoreProductCard";
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
  stores = [],
}) => {
  const t = useTranslations('FeaturedProducts');
  const locale = useLocale();
  const isRtl = locale?.startsWith('ar') ?? false;

  if (!products?.length) return null;

  // Header content
  const headerLeft = multiStore ? (
    <div className="fpc-header-left">
      <StackedStoreAvatars stores={stores} max={4} />
      <div className="fpc-title-block">
        <h2 className="fpc-title">
          {isRtl ? 'منتجات مميزة اليوم' : "Today's Top Deals"}
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
    <div className="fpc-header-left">
      {storeLogo && (
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
      )}
      <div className="fpc-title-block">
        <h2 className="fpc-title">
          {isRtl ? 'عروض اليوم المميزة' : "Today's Top Deals"}
        </h2>
        {stores.length > 0 && (
          <p className="fpc-subtitle">
            {isRtl
              ? (() => {
                  const names = stores.map(s => s.name || '').filter(Boolean);
                  if (names.length === 0) return '';
                  if (names.length === 1) return `من ${names[0]}`;
                  if (names.length === 2) return `من ${names[0]} و ${names[1]}`;
                  return `من ${names[0]} و ${names[1]} والمزيد`;
                })()
              : `FROM ${stores.map(s => (s.name || '').toUpperCase()).slice(0, 2).join(' & ')}${stores.length > 2 ? ' & MORE' : ''}`}
          </p>
        )}
      </div>
    </div>
  );

  const ctaHref = multiStore ? null : storeWebsiteUrl;

  // Slide width: responsive via CSS (using `.fpc-embla__slide` class)
  // We'll pass slideWidth="auto" and let CSS define the slide width.
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

      {/* Shared EmblaCarousel */}
      <EmblaCarousel
        locale={locale}
        slideWidth="280px"
        slideGap="0.75rem"
        freeScroll={true}
        scrollSlides={3}
        className="fpc-embla"
      >
        {products.map((product) => (
          <div key={product.id} className="fpc-embla__slide">
            <StoreProductCard
              product={product}
              voucher={product.voucher}
              otherPromo={product.otherPromo}
              storeName={multiStore ? product.storeName : storeName}
              storeLogo={multiStore ? product.storeLogo : undefined}
            />
          </div>
        ))}
      </EmblaCarousel>
    </section>
  );
};

export default FeaturedProductsCarousel;
