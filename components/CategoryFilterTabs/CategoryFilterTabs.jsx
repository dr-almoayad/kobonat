// components/CategoryFilterTabs/CategoryFilterTabs.jsx - UPDATED FOR SEO URLS
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import './CategoryFilterTabs.css';

const CategoryFilterTabs = ({ categories, currentCategory, locale }) => {
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations('CategoryFilterTabs');
  
  const visibleCategories = showAll 
    ? categories 
    : categories.slice(0, 8);
  
  if (!categories || categories.length === 0) return null;

  return (
    <div className="category_filter_tabs">
      <div className="tabs_container">
        {/* 'All' Tab */}
        <Link 
          href={`/${locale}/stores`}
          className={`category_tab ${!currentCategory ? 'active' : ''}`}
          aria-current={!currentCategory ? 'page' : undefined}
        >
          <span className="material-symbols-sharp">grid_view</span>
          <span className="tab_label">
            {t('all')}
          </span>
          <span className="tab_count">
            {categories.reduce((sum, cat) => sum + cat.storeCount, 0)}
          </span>
        </Link>
        
        {/* Dynamic Category Tabs - SEO FRIENDLY URLS */}
        {visibleCategories.map(category => (
          <Link
            key={category.id}
            href={`/${locale}/stores/${category.slug}`}
            className={`category_tab ${currentCategory === category.slug ? 'active' : ''}`}
            aria-current={currentCategory === category.slug ? 'page' : undefined}
            style={{ 
              '--category-color': category.color || '#470ae2',
              '--accent-color': category.color || '#470ae2'
            }}
          >
            <span className="material-symbols-sharp">
              {category.icon || 'category'}
            </span>
            <span className="tab_label">
              {category.name}
            </span>
            {/*<span className="tab_count">{category.storeCount}</span>*/}
          </Link>
        ))}
        
        {/* 'More' Button */}
        {categories.length > 8 && !showAll && (
          <button 
            className="category_tab more_button"
            onClick={() => setShowAll(true)}
            aria-label={t('showMore')}
            title={t('showMore')}
          >
            <span className="material-symbols-sharp">more_horiz</span>
            <span className="tab_label">
              {t('more')}
            </span>
          </button>
        )}
        
        {/* 'Less' Button */}
        {showAll && categories.length > 8 && (
          <button 
            className="category_tab more_button"
            onClick={() => setShowAll(false)}
            aria-label={t('showLess')}
            title={t('showLess')}
          >
            <span className="material-symbols-sharp">expand_less</span>
            <span className="tab_label">
              {t('less')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryFilterTabs;