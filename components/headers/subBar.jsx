// components/headers/subBar.jsx - UPDATED FOR COUNTRY-SENSITIVE CATEGORIES
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import './subBar.css';

const SubBar = () => {
  const t = useTranslations("SubBar");
  const locale = useLocale();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  
  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Extract language and country code from locale (e.g., 'ar-SA' -> language: 'ar', country: 'SA')
  const [language, countryCode] = locale.split('-');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreButtonRef.current && 
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch country-specific categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching categories for:', { language, countryCode, locale });
        
        // Fetch country-specific categories from API
        const response = await fetch(`/api/categories?locale=${language}&country=${countryCode}`, { 
          cache: 'force-cache' 
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Categories data received:', data);
          
          // Handle different response formats
          let categoriesData = [];
          
          if (Array.isArray(data)) {
            // Direct array response
            categoriesData = data;
          } else if (data.categories && Array.isArray(data.categories)) {
            // Nested categories object
            categoriesData = data.categories;
          } else if (data.data && Array.isArray(data.data)) {
            // Nested data object
            categoriesData = data.data;
          }
          
          // Filter categories with stores
          const categoriesWithStores = categoriesData.filter(cat => {
            // Check for different store count property names
            const storeCount = cat._count?.stores || cat.storeCount || cat.store_count || 0;
            return storeCount > 0;
          });
          
          console.log(`✅ Found ${categoriesWithStores.length} categories with stores`);
          
          // Transform to consistent format
          const transformedCategories = categoriesWithStores.map(cat => ({
            id: cat.id,
            name: cat.name || '',
            slug: cat.slug || '',
            icon: cat.icon || 'category',
            color: cat.color || '#470ae2',
            storeCount: cat._count?.stores || cat.storeCount || cat.store_count || 0,
            _count: {
              stores: cat._count?.stores || cat.storeCount || cat.store_count || 0
            }
          }));
          
          setCategories(transformedCategories);
        } else {
          console.error('❌ Failed to fetch categories:', response.status);
          // Fallback: try without country parameter
          const fallbackResponse = await fetch(`/api/categories?locale=${language}`, { 
            cache: 'force-cache' 
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackCategories = Array.isArray(fallbackData) ? fallbackData : [];
            const filtered = fallbackCategories.filter(cat => 
              cat._count?.stores > 0
            );
            
            const transformedFallback = filtered.map(cat => ({
              id: cat.id,
              name: cat.name || '',
              slug: cat.slug || '',
              icon: cat.icon || 'category',
              color: cat.color || '#470ae2',
              storeCount: cat._count?.stores || 0,
              _count: {
                stores: cat._count?.stores || 0
              }
            }));
            
            setCategories(transformedFallback);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [language, countryCode, locale]);

  // Calculate visible categories based on container width
  useEffect(() => {
    if (categories.length === 0 || !containerRef.current) return;

    const calculateVisibility = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const reservedSpace = 180; // Space for "All Stores" and "More" button
      let availableSpace = containerWidth - reservedSpace;
      
      let currentWidth = 0;
      let count = 0;
      const charWidth = 8; // Average character width
      const baseItemWidth = 46; // Padding, icon, margins

      for (const cat of categories) {
        const itemWidth = (cat.name.length * charWidth) + baseItemWidth;
        
        if (currentWidth + itemWidth < availableSpace) {
          currentWidth += itemWidth;
          count++;
        } else {
          break;
        }
      }

      setVisibleCount(Math.max(2, Math.min(count, categories.length)));
    };

    calculateVisibility();
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibility();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [categories]);

  // Split categories into visible and hidden
  const { visibleCategories, hiddenCategories } = useMemo(() => {
    return {
      visibleCategories: categories.slice(0, visibleCount),
      hiddenCategories: categories.slice(visibleCount)
    };
  }, [categories, visibleCount]);

  // Show loading skeleton
  if (loading) {
    return (
      <nav className='subBar' aria-label="Category Navigation">
        <div className='subBarContainer'>
          <div className='categoriesSection'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='categoryLink loading'>
                <span className="material-symbols-sharp">category</span>
                <span className="linkText skeleton-text"></span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Show message if no categories
  if (categories.length === 0) {
    return (
      <nav className='subBar' aria-label="Category Navigation">
        <div className='subBarContainer'>
          <div className='categoriesSection'>
            <Link href={`/${locale}/stores`} className='categoryLink allStores'>
              <span className="material-symbols-sharp">storefront</span>
              <span className="linkText">{t('stores')}</span>
            </Link>
            <div className="no-categories-message">
              {language === 'ar' ? 'لا توجد فئات متاحة حالياً' : 'No categories available'}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className='subBar' aria-label="Category Navigation">
      <div className='subBarContainer' ref={containerRef}>
        <div className='categoriesSection'>
          {/* All Stores Link */}
          <Link 
            href={`/${locale}/stores`} 
            className='categoryLink allStores'
            title={language === 'ar' ? 'جميع المتاجر' : 'All Stores'}
          >
            <span className="material-symbols-sharp">storefront</span>
            <span className="linkText">{t('stores')}</span>
            {/*<span className="store-count">
              {categories.reduce((sum, cat) => sum + (cat.storeCount || 0), 0)}
            </span>*/}
          </Link>

          {/* Visible Categories - Country Specific */}
          {visibleCategories.map(category => (
            <Link
              key={category.id}
              href={`/${locale}/stores/${category.slug}`}
              className='categoryLink'
              onClick={() => setShowMoreDropdown(false)}
              title={category.name}
              style={{
                '--category-color': category.color,
                '--accent-color': category.color
              }}
            >
              <span className="material-symbols-sharp">
                {category.icon}
              </span>
              <span className="linkText">{category.name}</span>
            </Link>
          ))}

          {/* More Button for Hidden Categories */}
          {hiddenCategories.length > 0 && (
            <div className="more-categories-container">
              <button 
                ref={moreButtonRef}
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className={`categoryLink more-button ${showMoreDropdown ? 'active' : ''}`}
                aria-expanded={showMoreDropdown}
                aria-label={language === 'ar' ? 'عرض المزيد من الفئات' : 'Show more categories'}
              >
                <span className="material-symbols-sharp">more_horiz</span>
                <span className="linkText">
                  {language === 'ar' ? 'المزيد' : 'More'}
                  <span className="hidden-count">+{hiddenCategories.length}</span>
                </span>
              </button>
              
              {showMoreDropdown && (
                <div 
                  className="more-dropdown" 
                  ref={dropdownRef}
                  role="menu"
                >
                  <div className="dropdown-header">
                    {language === 'ar' ? 'الفئات الإضافية' : 'More Categories'}
                    <span className="dropdown-total">{hiddenCategories.length}</span>
                  </div>
                  {hiddenCategories.map(category => (
                    <Link
                      key={category.id}
                      href={`/${locale}/stores/${category.slug}`}
                      className="more-dropdown-item"
                      onClick={() => setShowMoreDropdown(false)}
                      role="menuitem"
                      style={{
                        '--category-color': category.color
                      }}
                    >
                      <span className="material-symbols-sharp">
                        {category.icon}
                      </span>
                      <span className="linkText">{category.name}</span>
                      <span className="dropdown-count">
                        {category.storeCount}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SubBar;