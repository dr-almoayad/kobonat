'use client';
// components/FeaturedStoresCarousel/FeaturedStoresCarousel.jsx

import { useState } from 'react';
import StoreDiscountCard from '../StoreDiscountCard/StoreDiscountCard';
import './FeaturedStoresCarousel.css';

const PAGE_SIZE = 9; // 3 columns × 3 rows

// Arrow SVG paths
const ChevronLeft  = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  const [page, setPage] = useState(0);

  if (!stores.length) return null;

  const isRtl      = locale.startsWith('ar');
  const totalPages = Math.ceil(stores.length / PAGE_SIZE);
  const start      = page * PAGE_SIZE;
  const visible    = stores.slice(start, start + PAGE_SIZE);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  function prev() { setPage(p => Math.max(0, p - 1)); }
  function next() { setPage(p => Math.min(totalPages - 1, p + 1)); }

  // In RTL layouts the "back" arrow (visually on the right) moves forward in
  // reading direction, and the "forward" arrow (visually on the left) moves back.
  // So: left arrow = next in RTL, right arrow = prev in RTL.
  const leftArrowAction   = isRtl ? next : prev;
  const rightArrowAction  = isRtl ? prev : next;
  const leftArrowDisabled = isRtl ? !canNext : !canPrev;
  const rightArrowDisabled= isRtl ? !canPrev : !canNext;

  return (
    <section className="fsc">
      <div className="fsc-inner">

        <h2 className="fsc-title">{title}</h2>

        <div className="fsc-body">

          {/* Left arrow — shows on desktop only (CSS hides on mobile) */}
          <button
            className="fsc-arrow"
            onClick={leftArrowAction}
            disabled={leftArrowDisabled}
            aria-label={isRtl ? 'Next' : 'Previous'}
          >
            <ChevronLeft />
          </button>

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

          {/* Right arrow */}
          <button
            className="fsc-arrow"
            onClick={rightArrowAction}
            disabled={rightArrowDisabled}
            aria-label={isRtl ? 'Previous' : 'Next'}
          >
            <ChevronRight />
          </button>

        </div>

        {/* Dot indicators — only when multiple pages */}
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
