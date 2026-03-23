// FeaturedStoresCarousel.jsx
'use client';

import { useState, useEffect } from 'react';
import StoreDiscountCard from '../StoreDiscountCard/StoreDiscountCard';
import './FeaturedStoresCarousel.css';

const PAGE_SIZE = 9; // 3 columns × 3 rows

// Arrow SVG paths
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Simple media query hook
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  const [page, setPage] = useState(0);
  const isMobile = useMediaQuery('(max-width: 900px)');

  if (!stores.length) return null;

  const isRtl = locale.startsWith('ar');
  const totalPages = Math.ceil(stores.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visibleStores = stores.slice(start, start + PAGE_SIZE);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  function prev() { setPage(p => Math.max(0, p - 1)); }
  function next() { setPage(p => Math.min(totalPages - 1, p + 1)); }

  const leftArrowAction = isRtl ? next : prev;
  const rightArrowAction = isRtl ? prev : next;
  const leftArrowDisabled = isRtl ? !canNext : !canPrev;
  const rightArrowDisabled = isRtl ? !canPrev : !canNext;

  // Mobile layout: horizontal scroll with 3 rows
  if (isMobile) {
    return (
      <section className="fsc">
        <div className="fsc-inner">
          <h2 className="fsc-title">{title}</h2>
          <div className="fsc-mobile-scroll" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="fsc-mobile-grid">
              {stores.map(store => (
                <StoreDiscountCard key={store.id} store={store} locale={locale} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Desktop layout: paginated 3×3 grid with arrows and dots
  return (
    <section className="fsc">
      <div className="fsc-inner">
        <h2 className="fsc-title">{title}</h2>

        <div className="fsc-body">
          <button
            className="fsc-arrow"
            onClick={leftArrowAction}
            disabled={leftArrowDisabled}
            aria-label={isRtl ? 'Next' : 'Previous'}
          >
            <ChevronLeft />
          </button>

          <div className="fsc-grid">
            {visibleStores.map(store => (
              <StoreDiscountCard key={store.id} store={store} locale={locale} />
            ))}
          </div>

          <button
            className="fsc-arrow"
            onClick={rightArrowAction}
            disabled={rightArrowDisabled}
            aria-label={isRtl ? 'Previous' : 'Next'}
          >
            <ChevronRight />
          </button>
        </div>

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
