// components/breadcrumbs/Breadcrumbs.jsx
'use client';
import React from 'react';
import Link from 'next/link';
import './Breadcrumbs.css';
import { useLocale } from 'next-intl';

export default function Breadcrumbs({ category, brand, product }) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const trail = [{ name: 'Home', href: '/' }];

  // Build category trail recursively
  const buildCategoryTrail = (cat) => {
    if (!cat) return;
    if (cat.parent) buildCategoryTrail(cat.parent);
    trail.push({ 
      name: locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en, 
      href: `/categories/${cat.slug || cat.id}` 
    });
  };

  buildCategoryTrail(category);

  // Add brand if exists
  if (brand) {
    trail.push({ 
      name: locale === 'ar' && brand.name_ar ? brand.name_ar : brand.name_en, 
      href: `/brands/${brand.slug || brand.name_en.toLowerCase().replace(/\s+/g, '-')}` 
    });
  }

  // Add product as last item (not clickable)
  if (product) {
    trail.push({ 
      name: locale === 'ar' && product.name_ar ? product.name_ar : product.name_en, 
      href: '#' 
    });
  }

  return (
    <nav className="breadcrumbs" dir={isRtl ? 'rtl' : 'ltr'}>
      <ul>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.href}-${index}`} className={isLast ? 'active' : ''}>
              {isLast ? (
                <span>{item.name}</span>
              ) : (
                <>
                  <Link href={item.href}>{item.name}</Link>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}