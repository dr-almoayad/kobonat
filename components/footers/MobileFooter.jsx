'use client';
// components/footers/MobileFooter.jsx
// Updates:
//  - Adds "Stacks" as 5th nav tab (scrollable row)
//  - Seasonal pages (showInNav) appear as a row inside the categories menu
//  - Category links → /categories/[slug]
//  - Mobile-first: 5-tab bar with overflow-x scroll on very small screens

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import './MobileFooter.css';

const MobileFooter = () => {
  const t = useTranslations('MobileFooter');
  const locale = useLocale();
  const [language, region] = locale.split('-');
  const pathname = usePathname();

  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showStoresMenu,     setShowStoresMenu]     = useState(false);

  const [categories,        setCategories]        = useState([]);
  const [stores,            setStores]            = useState([]);
  const [seasonalPages,     setSeasonalPages]     = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [storesLoading,     setStoresLoading]     = useState(false);

  const categoriesMenuRef = useRef(null);
  const storesMenuRef     = useRef(null);

  // Fetch categories + seasonal nav pages on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/categories?locale=${language}&country=${region}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : []),
      fetch(`/api/seasonal?locale=${language}&nav=1`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : []),
    ]).then(([catData, seasonalData]) => {
      if (!mounted) return;
      const all = Array.isArray(catData) ? catData : [];
      setCategories(
        all
          .filter(c => (c._count?.stores || 0) > 0)
          .sort((a, b) => (b._count?.stores || 0) - (a._count?.stores || 0))
          .slice(0, 16)
      );
      setSeasonalPages(Array.isArray(seasonalData) ? seasonalData : []);
      setCategoriesLoading(false);
    }).catch(() => mounted && setCategoriesLoading(false));
    return () => { mounted = false; };
  }, [language, region]);

  // Fetch stores only when menu opens
  const fetchStores = () => {
    if (stores.length > 0) return;
    setStoresLoading(true);
    fetch(`/api/stores?limit=12&country=${region}&locale=${language}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { stores: [] })
      .then(data => {
        setStores((data.stores || []).slice(0, 10));
        setStoresLoading(false);
      })
      .catch(() => setStoresLoading(false));
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target))
        setShowCategoriesMenu(false);
      if (storesMenuRef.current && !storesMenuRef.current.contains(e.target))
        setShowStoresMenu(false);
    };
    if (showCategoriesMenu || showStoresMenu)
      document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCategoriesMenu, showStoresMenu]);

  const isActive = (path) => pathname?.includes(path);
  const closeAll = () => {
    setShowCategoriesMenu(false);
    setShowStoresMenu(false);
  };

  return (
    <>
      {/* Overlay */}
      {(showCategoriesMenu || showStoresMenu) && (
        <div className="mobile-footer-overlay" onClick={closeAll} />
      )}

      {/* ── Categories menu ── */}
      {showCategoriesMenu && (
        <div className="categories-context-menu" ref={categoriesMenuRef}>
          <div className="categories-menu-header">
            <span className="material-symbols-sharp">category</span>
            <h3>{t('categories') || 'Categories'}</h3>
          </div>

          {/* Seasonal pages row — shown above the grid when available */}
          {!categoriesLoading && seasonalPages.length > 0 && (
            <div className="seasonal-row">
              <div className="seasonal-row__label">
                <span className="material-symbols-sharp">celebration</span>
                {language === 'ar' ? 'مواسم' : 'Seasonal'}
              </div>
              <div className="seasonal-row__items">
                {seasonalPages.map(sp => (
                  <Link
                    key={sp.id}
                    href={`/${locale}/seasonal/${sp.slug}`}
                    className={`seasonal-pill${sp.isLive ? ' seasonal-pill--live' : ''}`}
                    onClick={closeAll}
                  >
                    {sp.isLive && <span className="seasonal-pill__dot" aria-hidden="true" />}
                    {sp.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stacks shortcut */}
          <div className="stacks-shortcut">
            <Link
              href={`/${locale}/stacks`}
              className="stacks-shortcut__link"
              onClick={closeAll}
            >
              <span className="material-symbols-sharp">bolt</span>
              {language === 'ar' ? 'اجمع ووفر' : 'Stack & Save'}
              <span className="material-symbols-sharp stacks-shortcut__arrow">
                {language === 'ar' ? 'chevron_left' : 'chevron_right'}
              </span>
            </Link>
          </div>

          {/* Categories grid */}
          <div className="categories-grid-container">
            {categoriesLoading ? (
              <div className="menu-loading" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <p>{language === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="menu-empty" style={{ gridColumn: '1 / -1' }}>
                <span className="material-symbols-sharp empty-icon">category</span>
                <p>{language === 'ar' ? 'لا توجد فئات' : 'No categories available'}</p>
              </div>
            ) : categories.map(cat => (
              <Link
                key={cat.id}
                href={`/${locale}/categories/${cat.slug}`}
                className="category-grid-item"
                onClick={closeAll}
              >
                <div className="category-image-wrapper">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={48} height={48}
                      className="category-image"
                      sizes="48px"
                    />
                  ) : (
                    <span className="material-symbols-sharp category-icon-fallback">
                      {cat.icon || 'category'}
                    </span>
                  )}
                </div>
                <span className="category-name-grid">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stores menu ── */}
      {showStoresMenu && (
        <div className="stores-context-menu" ref={storesMenuRef}>
          <div className="stores-menu-header">
            <span className="material-symbols-sharp">storefront</span>
            <h3>{t('stores') || 'Stores'}</h3>
          </div>

          <div className="stores-menu-items">
            {storesLoading ? (
              <div className="menu-loading">
                <p>{language === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
              </div>
            ) : stores.length === 0 ? (
              <div className="menu-empty">
                <span className="material-symbols-sharp empty-icon">storefront</span>
                <p>{language === 'ar' ? 'لا توجد متاجر' : 'No stores available'}</p>
              </div>
            ) : (
              <>
                {stores.map(store => (
                  <Link
                    key={store.id}
                    href={`/${locale}/stores/${store.slug}`}
                    className="store-menu-item"
                    onClick={closeAll}
                  >
                    <div className="store-logo-wrapper">
                      {store.logo ? (
                        <Image src={store.logo} alt={store.name}
                          width={56} height={32} className="store-logo-img" />
                      ) : (
                        <span className="material-symbols-sharp">storefront</span>
                      )}
                    </div>
                    <div className="store-info">
                      <span className="store-name">{store.name}</span>
                      {store._count?.vouchers > 0 && (
                        <span className="store-voucher-count">
                          {store._count.vouchers} {language === 'ar' ? 'كوبون' : 'coupons'}
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-sharp menu-arrow">
                      {language === 'ar' ? 'chevron_left' : 'chevron_right'}
                    </span>
                  </Link>
                ))}

                <Link href={`/${locale}/stores`} className="view-all-link" onClick={closeAll}>
                  <span>{language === 'ar' ? 'عرض جميع المتاجر' : 'View all stores'}</span>
                  <span className="material-symbols-sharp">
                    {language === 'ar' ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Sticky bottom nav — 5 tabs ── */}
      <nav className="mobile-footer" aria-label="Mobile navigation">
        <div className="mobile-footer-container">

          {/* Home */}
          <Link
            href={`/${locale}`}
            className={`footer-item ${pathname === `/${locale}` || pathname === `/${locale}/` ? 'active' : ''}`}
          >
            <span className="material-symbols-sharp">home</span>
            <span className="footer-label">{t('home') || 'Home'}</span>
          </Link>

          {/* Stacks — prominent accent tab */}
          <Link
            href={`/${locale}/stacks`}
            className={`footer-item footer-item--stacks ${isActive('/stacks') ? 'active' : ''}`}
            onClick={closeAll}
          >
            <span className="material-symbols-sharp">bolt</span>
            <span className="footer-label">{language === 'ar' ? 'ادمج' : 'Stacks'}</span>
          </Link>

          {/* Stores */}
          <button
            className={`footer-item ${showStoresMenu ? 'active' : ''}`}
            onClick={() => {
              setShowCategoriesMenu(false);
              const opening = !showStoresMenu;
              setShowStoresMenu(opening);
              if (opening) fetchStores();
            }}
          >
            <span className="material-symbols-sharp">storefront</span>
            <span className="footer-label">{t('stores') || 'Stores'}</span>
          </button>

          {/* Categories */}
          <button
            className={`footer-item ${showCategoriesMenu ? 'active' : ''}`}
            onClick={() => {
              setShowStoresMenu(false);
              setShowCategoriesMenu(v => !v);
            }}
          >
            <span className="material-symbols-sharp">category</span>
            <span className="footer-label">{t('categories') || 'Categories'}</span>
          </button>

          {/* Coupons */}
          <Link
            href={`/${locale}/coupons`}
            className={`footer-item ${isActive('/coupons') ? 'active' : ''}`}
            onClick={closeAll}
          >
            <span className="material-symbols-sharp">local_offer</span>
            <span className="footer-label">{t('coupons') || 'Coupons'}</span>
          </Link>

        </div>
      </nav>
    </>
  );
};

export default MobileFooter;
