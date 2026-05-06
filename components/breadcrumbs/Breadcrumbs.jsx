// components/breadcrumbs/Breadcrumbs.jsx
//
// Accepts two calling conventions:
//
//   1. Legacy (category pages, product pages):
//      <Breadcrumbs category={cat} brand={brand} product={product} />
//      Builds the trail by recursively walking category.parent, then appending
//      brand and product.
//
//   2. Flat items array (store pages and anywhere that pre-builds the trail):
//      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Stores', href: '/stores' }, ...]} />
//      Renders the provided items directly with no additional processing.
//
// The last item in either mode is rendered as a non-linked <span> (current page).
//
'use client';
import React from 'react';
import Link from 'next/link';
import './Breadcrumbs.css';
import { useLocale } from 'next-intl';

export default function Breadcrumbs({ category, brand, product, items }) {
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');

  // ── Mode 1: flat items array ───────────────────────────────────────────────
  if (Array.isArray(items) && items.length > 0) {
    return (
      <nav className="breadcrumbs" dir={isRtl ? 'rtl' : 'ltr'} aria-label="breadcrumb">
        <ul>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.href ?? item.name}-${index}`} className={isLast ? 'active' : ''}>
                {isLast ? (
                  <span>{item.name}</span>
                ) : (
                  <Link href={item.href}>{item.name}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  // ── Mode 2: legacy category / brand / product props ────────────────────────
  const trail = [{ name: locale.startsWith('ar') ? 'الرئيسية' : 'Home', href: `/${locale}` }];

  const buildCategoryTrail = (cat) => {
    if (!cat) return;
    if (cat.parent) buildCategoryTrail(cat.parent);
    trail.push({
      name: locale.startsWith('ar') && cat.name_ar ? cat.name_ar : cat.name_en,
      href: `/categories/${cat.slug || cat.id}`,
    });
  };

  buildCategoryTrail(category);

  if (brand) {
    trail.push({
      name: locale.startsWith('ar') && brand.name_ar ? brand.name_ar : brand.name_en,
      href: `/brands/${brand.slug || brand.name_en.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  if (product) {
    trail.push({
      name: locale.startsWith('ar') && product.name_ar ? product.name_ar : product.name_en,
      href: '#',
    });
  }

  return (
    <nav className="breadcrumbs" dir={isRtl ? 'rtl' : 'ltr'} aria-label="breadcrumb">
      <ul>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.href}-${index}`} className={isLast ? 'active' : ''}>
              {isLast ? (
                <span>{item.name}</span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
