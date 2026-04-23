'use client';
// components/footers/MobileFooter.jsx
// Premium mobile footer: full‑width nav bar, context menus with static seasonal links

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import './MobileFooter.css';

// ─── Static seasonal links (sorted by SEO/popularity) ─────────────────────────
const SEASONAL_LINKS = [
  { slug: 'white_friday',    priority: 1, icon: '🎄' },
  { slug: 'ramadan',         priority: 2, icon: '🌙' },
  { slug: 'eid_al_fitr',     priority: 3, icon: '🕌' },
  { slug: 'eid_al_adha',     priority: 4, icon: '🐏' },
  { slug: 'summer_sale',     priority: 5, icon: '☀️' },
  { slug: 'back_to_school',  priority: 6, icon: '📚' },
  { slug: 'national_day',    priority: 7, icon: '🇸🇦' },
  { slug: 'year_end',        priority: 8, icon: '🎆' },
];

function getSeasonalTitle(slug, locale) {
  const titles = {
    white_friday:    { ar: 'الجمعة البيضاء',   en: 'White Friday'    },
    ramadan:         { ar: 'رمضان',            en: 'Ramadan'         },
    eid_al_fitr:     { ar: 'عيد الفطر',        en: 'Eid al-Fitr'     },
    eid_al_adha:     { ar: 'عيد الأضحى',       en: 'Eid al-Adha'     },
    summer_sale:     { ar: 'تخفيضات الصيف',    en: 'Summer Sale'     },
    back_to_school:  { ar: 'العودة للمدارس',   en: 'Back to School'  },
    national_day:    { ar: 'اليوم الوطني',     en: 'National Day'    },
    year_end:        { ar: 'نهاية السنة',      en: 'Year End'        },
  };
  const lang = locale.startsWith('ar') ? 'ar' : 'en';
  return titles[slug]?.[lang] || slug.replace(/_/g, ' ');
}

const MobileFooter = () => {
  const t = useTranslations('MobileFooter');
  const locale = useLocale();
  const [language, region] = locale.split('-');
  const pathname = usePathname();

  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showStoresMenu,     setShowStoresMenu]     = useState(false);

  const [categories,        setCategories]        = useState([]);
  const [stores,            setStores]            = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [storesLoading,     setStoresLoading]     = useState(false);

  const categoriesMenuRef = useRef(null);
  const storesMenuRef     = useRef(null);

  // Fetch categories only (static seasonal links always available)
  useEffect(() => {
    let mounted = true;
    fetch(`/api/categories?locale=${language}&country=${region}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!mounted) return;
        const all = Array.isArray(data) ? data : [];
        setCategories(
          all
            .filter(c => (c._count?.stores || 0) > 0)
            .sort((a, b) => (b._count?.stores || 0) - (a._count?.stores || 0))
            .slice(0, 16)
        );
        setCategoriesLoading(false);
      })
      .catch(() => mounted && setCategoriesLoading(false));
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

  // Static seasonal links sorted by priority
  const seasonalLinksSorted = [...SEASONAL_LINKS].sort((a, b) => a.priority - b.priority);

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

          {/* Seasonal row – static important links */}
          <div className="seasonal-row">
            <div className="seasonal-row__label">
              <span className="material-symbols-sharp">celebration</span>
              {language === 'ar' ? 'مواسم' : 'Seasonal'}
            </div>
            <div className="seasonal-row__items">
              {seasonalLinksSorted.map(link => (
                <Link
                  key={link.slug}
                  href={`/${locale}/seasonal/${link.slug}`}
                  className="seasonal-pill"
                  onClick={closeAll}
                >
                  <span className="seasonal-pill__icon">{link.icon}</span>
                  {getSeasonalTitle(link.slug, locale)}
                </Link>
              ))}
            </div>
          </div>

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
            ) : (
              categories.map(cat => (
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
                        width={48}
                        height={48}
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
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Stores menu (unchanged) ── */}
      {showStoresMenu && (
        <div className="stores-context-menu" ref={storesMenuRef}>
          <div className="stores-menu-header">
            <span className="material-symbols-sharp">storefront</span>
            <h3>{t('stores') || 'Stores'}</h3>
          </div>
          <div className="stores-menu-items">
            {storesLoading ? (
              <div className="menu-loading"><p>{language === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p></div>
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
                        <Image src={store.logo} alt={store.name} width={56} height={32} className="store-logo-img" />
                      ) : (
                        <span className="material-symbols-sharp">storefront</span>
                      )}
                    </div>
                    <div className="store-info">
                      <span className="store-name">{store.name}</span>
                      {store._count?.vouchers > 0 && (
                        <span className="store-voucher-count">{store._count.vouchers} {language === 'ar' ? 'كوبون' : 'coupons'}</span>
                      )}
                    </div>
                    <span className="material-symbols-sharp menu-arrow">
                      {language === 'ar' ? 'chevron_left' : 'chevron_right'}
                    </span>
                  </Link>
                ))}
                <Link href={`/${locale}/stores`} className="view-all-link" onClick={closeAll}>
                  <span>{language === 'ar' ? 'عرض جميع المتاجر' : 'View all stores'}</span>
                  <span className="material-symbols-sharp">{language === 'ar' ? 'arrow_back' : 'arrow_forward'}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Sticky bottom nav – full width buttons ── */}
      <nav className="mobile-footer" aria-label="Mobile navigation">
        <div className="mobile-footer-container">
          <Link href={`/${locale}`} className={`footer-item ${pathname === `/${locale}` || pathname === `/${locale}/` ? 'active' : ''}`}>
            <span className="material-symbols-sharp">home</span>
            <span className="footer-label">{t('home') || 'Home'}</span>
          </Link>
          <Link href={`/${locale}/stacks`} className={`footer-item footer-item--stacks ${isActive('/stacks') ? 'active' : ''}`} onClick={closeAll}>
            <span className="material-symbols-sharp">bolt</span>
            <span className="footer-label">{language === 'ar' ? 'ادمج' : 'Stacks'}</span>
          </Link>
          <button className={`footer-item ${showStoresMenu ? 'active' : ''}`} onClick={() => { setShowCategoriesMenu(false); const opening = !showStoresMenu; setShowStoresMenu(opening); if (opening) fetchStores(); }}>
            <span className="material-symbols-sharp">storefront</span>
            <span className="footer-label">{t('stores') || 'Stores'}</span>
          </button>
          <button className={`footer-item ${showCategoriesMenu ? 'active' : ''}`} onClick={() => { setShowStoresMenu(false); setShowCategoriesMenu(v => !v); }}>
            <span className="material-symbols-sharp">category</span>
            <span className="footer-label">{t('categories') || 'Categories'}</span>
          </button>
          <Link href={`/${locale}/coupons`} className={`footer-item ${isActive('/coupons') ? 'active' : ''}`} onClick={closeAll}>
            <span className="material-symbols-sharp">local_offer</span>
            <span className="footer-label">{t('coupons') || 'Coupons'}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileFooter;
