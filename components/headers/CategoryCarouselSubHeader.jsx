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

    // ── Embla setup ────────────────────────────────────────────────────────
    const [emblaRef, emblaApi] = useEmblaCarousel({
        direction:     isAr ? 'rtl' : 'ltr',
        align:         'start',
        dragFree:      true,
        loop:          false,
        containScroll: false,
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

    // ── Fetch categories ───────────────────────────────────────────────────
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const [language, region] = locale.split('-');
                const url = `/api/categories?locale=${language}&country=${region}`;
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to load');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('CategoryCarousel error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [locale]);

    // ── Hide on scroll-down, show on scroll-up ─────────────────────────────
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                if (currentScrollY > lastScrollYRef.current && currentScrollY > 60) {
                    setIsVisible(false);
                } else if (currentScrollY < lastScrollYRef.current || currentScrollY < 40) {
                    setIsVisible(true);
                }
                lastScrollYRef.current = currentScrollY;
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

                {/* ── Prev arrow — desktop only ──────────────────────────── */}
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

                {/* ── Embla viewport ────────────────────────────────────── */}
                <div className="ccs-viewport" ref={emblaRef}>
                    <div className="ccs-track">
                        {categories.map((category, idx) => (
                            <div
                                key={category.id}
                                className="ccs-slide"
                                style={{
                                    marginInlineStart: idx === 0 ? 0 : undefined,
                                }}
                            >
                                <Link
                                    href={`/${locale}/stores/${category.slug}`}
                                    className="ccs-item"
                                >
                                    <div className="ccs-icon-wrap">
                                        {category.image ? (
                                            <Image
                                                src={category.image}
                                                width={30}
                                                height={30}
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
                    </div>
                </div>

                {/* ── Next arrow — desktop only ──────────────────────────── */}
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
