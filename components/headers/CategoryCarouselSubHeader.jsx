"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import './CategoryCarouselSubHeader.css';

const CategoryCarouselSubHeader = () => {
    const locale = useLocale();
    const isAr   = locale?.startsWith('ar');

    const [categories, setCategories] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [isVisible,  setIsVisible]  = useState(true);
    const [canPrev,    setCanPrev]    = useState(false);
    const [canNext,    setCanNext]    = useState(false);

    const lastScrollYRef = useRef(0);

    // ── Embla ──────────────────────────────────────────────────────────────
    // containScroll:'trimSnaps' is critical — prevents the empty gap at the
    // end by trimming the scroll range to exactly the last slide edge.
    const [emblaRef, emblaApi] = useEmblaCarousel({
        direction:     isAr ? 'rtl' : 'ltr',
        align:         'start',
        dragFree:      true,
        loop:          false,
        containScroll: 'trimSnaps',
    });

    const syncArrows = useCallback((api) => {
        setCanPrev(api.canScrollPrev());
        setCanNext(api.canScrollNext());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        syncArrows(emblaApi);
        emblaApi.on('scroll',  () => syncArrows(emblaApi));
        emblaApi.on('reInit',  () => syncArrows(emblaApi));
        emblaApi.on('select',  () => syncArrows(emblaApi));
    }, [emblaApi, syncArrows]);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    // ── Fetch ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const [language, region] = locale.split('-');
                const res = await fetch(
                    `/api/categories?locale=${language}&country=${region}`,
                    { cache: 'no-store' }
                );
                if (!res.ok) throw new Error('Failed to load');
                setCategories(await res.json());
            } catch (err) {
                console.error('CategoryCarousel:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [locale]);

    // ── Hide on scroll-down, reveal on scroll-up ───────────────────────────
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const y = window.scrollY;
                if (y > lastScrollYRef.current && y > 60) setIsVisible(false);
                else if (y < lastScrollYRef.current || y < 40) setIsVisible(true);
                lastScrollYRef.current = y;
                ticking = false;
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading || categories.length === 0) return null;

    return (
        <div className={`ccs-wrapper ${isVisible ? 'ccs-visible' : 'ccs-hidden'}`}>
            <div className="ccs-inner">

                {/* Prev — desktop only */}
                <button
                    className="ccs-arrow"
                    onClick={isAr ? scrollNext : scrollPrev}
                    disabled={isAr ? !canNext : !canPrev}
                    aria-label={isAr ? 'السابق' : 'Previous'}
                >
                    <span className="material-symbols-sharp">
                        {isAr ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>

                {/* Embla viewport */}
                <div className="ccs-viewport" ref={emblaRef}>
                    <div className="ccs-track">
                        {categories.map((category, idx) => (
                            <div
                                key={category.id}
                                className="ccs-slide"
                                style={idx === 0 ? { marginInlineStart: 0 } : undefined}
                            >
                                <Link
                                    href={`/${locale}/categories/${category.slug}`}
                                    className="ccs-item"
                                >
                                    <div className="ccs-icon-wrap">
                                        <span className="material-symbols-sharp ccs-icon">
                                            {category.icon || 'category'}
                                        </span>
                                        {/*{category.image ? (
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
                                        )}*/}
                                    </div>
                                    <span className="ccs-name">{category.name}</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next — desktop only */}
                <button
                    className="ccs-arrow"
                    onClick={isAr ? scrollPrev : scrollNext}
                    disabled={isAr ? !canPrev : !canNext}
                    aria-label={isAr ? 'التالي' : 'Next'}
                >
                    <span className="material-symbols-sharp">
                        {isAr ? 'chevron_left' : 'chevron_right'}
                    </span>
                </button>

            </div>
        </div>
    );
};

export default CategoryCarouselSubHeader;
