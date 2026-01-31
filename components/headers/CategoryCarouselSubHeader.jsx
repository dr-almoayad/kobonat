"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import './CategoryCarouselSubHeader.css';

const CategoryCarouselSubHeader = () => {
    const locale = useLocale();
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    
    const carouselRef = useRef(null);
    const lastScrollYRef = useRef(0);

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
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchCategories();
    }, [locale]);

    // FIXED: Smooth scroll logic with requestAnimationFrame
    useEffect(() => {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    
                    // Hide when scrolling down past 100px, show when near top
                    if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
                        setIsVisible(false);
                    } else if (currentScrollY < lastScrollYRef.current || currentScrollY < 50) {
                        setIsVisible(true);
                    }
                    
                    lastScrollYRef.current = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading || categories.length === 0) return null;

    return (
        <div className={`category-carousel-wrapper ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="category-carousel" ref={carouselRef}>
                <div className="category-carousel-track">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/${locale}/stores/${category.slug}`}
                            className="category-item"
                        >
                            <div className="category-icon-wrapper">
                                {category.image ? (
                                    <Image 
                                        src={category.image} 
                                        width={40} 
                                        height={40} 
                                        alt={category.name}
                                        className="category-img-content"
                                    />
                                ) : (
                                    <span className="material-symbols-sharp category-icon">
                                        {category.icon || 'category'}
                                    </span>
                                )}
                            </div>
                            <span className="category-name">{category.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryCarouselSubHeader;
