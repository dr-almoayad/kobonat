"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './CategoryCarouselSubHeader.css';

/**
 * CategoryCarouselSubHeader – Sticky category navigation bar
 * 
 * ✅ FIXED: Now receives `initialCategories` as a prop from the parent server component.
 *           No more client‑side data fetching, no `{ cache: 'no-store' }` API calls.
 *           This eliminates ISR cache poisoning and database connection pool exhaustion.
 * 
 * @param {Array} initialCategories – Pre‑fetched categories (server‑side, with ISR caching)
 */
const CategoryCarouselSubHeader = ({ initialCategories = [] }) => {
  const locale = useLocale();
  const isAr = locale?.startsWith('ar');

  // Use the pre‑fetched data directly – no loading state needed
  const [categories] = useState(initialCategories);

  // Scroll hide/show logic (unchanged)
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastScrollYRef.current && y > 60) {
          setIsVisible(false);
        } else if (y < lastScrollYRef.current || y < 40) {
          setIsVisible(true);
        }
        lastScrollYRef.current = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If no categories, render nothing (graceful fallback)
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className={`ccs-wrapper ${isVisible ? 'ccs-visible' : 'ccs-hidden'}`}>
      <div className="ccs-inner">
        <EmblaCarousel
          locale={locale}
          slideWidth="auto"
          slideGap="0.2rem"
          freeScroll={true}
          scrollSlides={7}        // scroll 7 slides per click
          className="ccs-embla"
        >
          {categories.map((category) => (
            <div key={category.id} className="ccs-slide">
              <Link href={`/${locale}/categories/${category.slug}`} className="ccs-item">
                <div className="ccs-icon-wrap">
                  {category.image ? (
                    <Image
                      src={category.image}
                      width={56}
                      height={56}
                      alt={category.name}
                      className="ccs-img"
                    />
                  ) : (
                    <span className="material-symbols-sharp ccs-icon">
                      {category.icon || 'category'}
                    </span>
                  )}
                </div>
                <span className="ccs-name">{category.name}</span>
              </Link>
            </div>
          ))}
        </EmblaCarousel>
      </div>
    </div>
  );
};

export default CategoryCarouselSubHeader;
