// components/Breadcrumbs/Breadcrumbs.jsx
'use client';
import React from 'react';
import Link from 'next/link';
import './Breadcrumbs.css';
import { useLocale } from 'next-intl';

export default function Breadcrumbs({ category, brand, product, items }) {
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');

  // Helper to build a proper localized URL
  const localizeHref = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${clean}`;
  };

  // ── Mode 1: flat items array (used by store pages) ──
  if (Array.isArray(items) && items.length > 0) {
    return (
      <nav className="breadcrumbs" dir={isRtl ? 'rtl' : 'ltr'} aria-label="breadcrumb">
        <ul>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const href = localizeHref(item.url);
            return (
              <li key={`${href}-${index}`} className={isLast ? 'active' : ''}>
                {isLast ? (
                  <span>{item.name}</span>
                ) : (
                  <Link href={href}>{item.name}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  // ── Mode 2: legacy category / brand / product props ──
  const trail = [];
  trail.push({ name: locale.startsWith('ar') ? 'الرئيسية' : 'Home', href: '/' });

  // Build category trail recursively, ensuring each href is localized
  const buildCategoryTrail = (cat) => {
    if (!cat) return;
    if (cat.parent) buildCategoryTrail(cat.parent);
    const slug = cat.slug || cat.id;
    const name = locale.startsWith('ar') && cat.name_ar ? cat.name_ar : cat.name_en;
    trail.push({ name, href: `/categories/${slug}` });
  };
  buildCategoryTrail(category);

  if (brand) {
    const brandSlug = brand.slug || brand.name_en?.toLowerCase().replace(/\s+/g, '-');
    const brandName = locale.startsWith('ar') && brand.name_ar ? brand.name_ar : brand.name_en;
    trail.push({ name: brandName, href: `/brands/${brandSlug}` });
  }

  if (product) {
    const productName = locale.startsWith('ar') && product.name_ar ? product.name_ar : product.name_en;
    trail.push({ name: productName, href: '#' }); // current page, no link
  }

  return (
    <nav className="breadcrumbs" dir={isRtl ? 'rtl' : 'ltr'} aria-label="breadcrumb">
      <ul>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          const href = localizeHref(item.href);
          return (
            <li key={`${href}-${index}`} className={isLast ? 'active' : ''}>
              {isLast || href === '#' ? (
                <span>{item.name}</span>
              ) : (
                <Link href={href}>{item.name}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
