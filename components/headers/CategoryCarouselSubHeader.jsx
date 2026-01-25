"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation'; // Added
import Link from 'next/link';
import Image from 'next/image';
import './CategoryCarouselSubHeader.css';

const CategoryCarouselSubHeader = () => {
    const locale = useLocale();
    const pathname = usePathname(); // Get current path
    
    // 1. Move State Declarations to the TOP
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    
    const carouselRef = useRef(null);

    // 2. Logic to check if we are on a Store Detail page
    // This prevents the carousel from appearing on store pages where it conflicts with StoreHeader
    // const isStoreDetailPage = pathname.includes('/stores/') && pathname.split('/').filter(Boolean).length >= 3;

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

    // Scroll effect logic
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // 3. Early return AFTER hooks are defined
    if ( loading || categories.length === 0) return null;

    return (
        <div 
            className="category-carousel-wrapper"
            style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: isVisible ? 1 : 0
            }}
        >
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
