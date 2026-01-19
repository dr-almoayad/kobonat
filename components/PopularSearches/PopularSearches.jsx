"use client";
import React from 'react';
import { useTranslations } from 'next-intl'; // Import useTranslations
import './PopularSearches.css';

// You can fetch this data or define it statically
const popularSearches = [
  'Dyson', 'Vitamin C Serum', 'Sunscreen', 'Self Tanner', 'Samsung S25',
  'S25 Ultra', 'Travel Luggage', 'Body Mist', 'Labubu', 'iPhone 17 Pro',
  'iPhone 17 Air', 'iPhone 17 Pro Max', 'iPhone 17 Price', 'Best Laptops',
  'Dior Perfume', 'Chanel Perfume', 'Rasasi Perfume', 'Versace Perfume',
  'Samsung Laptops', 'MacBook', 'Microsoft Laptops', 'ASUS Laptops', 'Dell',
  'Lenovo', 'HP Laptops', 'Huawei Laptops', 'Samsung S24', 'iPhone 14',
  'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra', 'iPhone 16 Pro'
];

const PopularSearches = () => {
  const t = useTranslations('PopularSearches'); // Initialize translations for PopularSearches

  return (
    <section className="popular-searches-section">
      <h2 className="popular-searches-title">{t('title')}</h2>
      <div className="popular-searches-tags">
        {popularSearches.map((term, index) => (
          <a 
            key={index} 
            href={`/search?q=${encodeURIComponent(term)}`} 
            className="search-tag"
          >
            {term}
          </a>
        ))}
      </div>
    </section>
  );
};

export default PopularSearches;