'use client';
// components/FeaturedStoresCarousel2/FeaturedStoresCarousel2.jsx
//
// Displays a 3-column × 3-row grid of StoreDiscountCard items.
// Arrow buttons page through sets of 9.
// Completely separate from the CuratedOffer / OfferCard system.
//
// Required prop shape for each item in `stores`:
// {
//   id:               number | string,
//   name:             string,
//   logo:             string | null,
//   slug:             string,
//   ctaUrl:           string | null,   // overrides slug-based URL
//   discount:         string,          // e.g. "Up to 15% off"
//   previousDiscount: string | null,   // e.g. "10% off"  → shown as "was 10% off"
//   isPersonalized:   boolean,         // shows "Just for you" badge
// }

import { useState } from 'react';
import StoreDiscountCard from '../StoreDiscountCard/StoreDiscountCard';
import './FeaturedStoresCarousel2.css';

const PAGE_SIZE = 9; // 3 columns × 3 rows

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  const [page, setPage] = useState(0);

  if (!stores.length) return null;

  const totalPages = Math.ceil(stores.length / PAGE_SIZE);
  const start      = page * PAGE_SIZE;
  const visible    = stores.slice(start, start + PAGE_SIZE);
  const isRtl      = locale.startsWith('ar');

  function prev() { setPage(p => Math.max(0, p - 1)); }
  function next() { setPage(p => Math.min(totalPages - 1, p + 1)); }

  return (
    <section className="fsc">
      <div className="fsc-inner">

        {/* Header */}
        <h2 className="fsc-title">{title}</h2>

        {/* Grid + side arrow */}
        <div className="fsc-body">

          {/* Prev arrow (RTL only — mirrors layout) */}
          {isRtl && (
            <button
              className="fsc-arrow fsc-arrow--prev"
              onClick={prev}
              disabled={page === 0}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Card grid */}
          <div className="fsc-grid">
            {visible.map(store => (
              <StoreDiscountCard
                key={store.id}
                store={store}
                locale={locale}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            className="fsc-arrow fsc-arrow--next"
            onClick={isRtl ? prev : next}
            disabled={isRtl ? page === 0 : page >= totalPages - 1}
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

        </div>

        {/* Dot indicators — only when more than one page */}
        {totalPages > 1 && (
          <div className="fsc-dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`fsc-dot${i === page ? ' fsc-dot--active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
