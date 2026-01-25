// components/footers/MobileFooter.jsx - UPDATED WITH COUPONS TAB
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import './MobileFooter.css';

const MobileFooter = () => {
  const t = useTranslations('MobileFooter');
  const locale = useLocale();
  const [language, region] = locale.split('-');
  const pathname = usePathname();
  const router = useRouter();
  
  const [showCouponsMenu, setShowCouponsMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showStoresMenu, setShowStoresMenu] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  
  const couponsMenuRef = useRef(null);
  const categoriesMenuRef = useRef(null);
  const storesMenuRef = useRef(null);

  // Fetch categories for grid
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?locale=${language}&country=${region}`, {
          cache: 'force-cache',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to load categories');

        const data = await response.json();
        
        if (isMounted) {
          const validCategories = Array.isArray(data) 
            ? data.filter(cat => cat._count?.stores > 0)
            : (data.categories || []).filter(cat => cat._count?.stores > 0);
          
          // Sort by store count and limit for grid
          const sortedCategories = validCategories
            .sort((a, b) => (b._count?.stores || 0) - (a._count?.stores || 0))
            .slice(0, 12);
          
          setCategories(sortedCategories);
          setCategoriesLoading(false);
        }
      } catch (error) {
        console.error('Category error:', error);
        if (isMounted) {
          setCategories([]);
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, [language, region]);

  // Fetch coupons when menu opens
  const fetchCoupons = async () => {
    if (coupons.length > 0) return;
    
    setCouponsLoading(true);
    try {
      const url = `/api/coupons?limit=10&country=${region}&locale=${language}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch coupons');
      }
      
      const data = await res.json();
      const couponsList = data.coupons || data || [];
      
      if (Array.isArray(couponsList)) {
        setCoupons(couponsList.slice(0, 8)); // Limit to 8 for better display
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch stores when menu opens
  const fetchStores = async () => {
    if (stores.length > 0) return;
    
    setStoresLoading(true);
    try {
      const url = `/api/stores?limit=10&country=${region}&locale=${language}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await res.json();
      const storesList = data.stores || [];
      
      if (Array.isArray(storesList)) {
        setStores(storesList.slice(0, 10));
      } else {
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (couponsMenuRef.current && !couponsMenuRef.current.contains(event.target)) {
        setShowCouponsMenu(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target)) {
        setShowCategoriesMenu(false);
      }
      if (storesMenuRef.current && !storesMenuRef.current.contains(event.target)) {
        setShowStoresMenu(false);
      }
    };

    if (showCouponsMenu || showCategoriesMenu || showStoresMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCouponsMenu, showCategoriesMenu, showStoresMenu]);

  const handleCouponsClick = () => {
    if (!showCouponsMenu) {
      fetchCoupons();
    }
    setShowCouponsMenu(!showCouponsMenu);
  };

  const handleStoresClick = () => {
    if (!showStoresMenu) {
      fetchStores();
    }
    setShowStoresMenu(!showStoresMenu);
  };

  const isActive = (path) => pathname?.includes(path);

  return (
    <>
      {/* Overlay when menu is open */}
      {(showCouponsMenu || showCategoriesMenu || showStoresMenu) && (
        <div 
          className="mobile-footer-overlay"
          onClick={() => {
            setShowCouponsMenu(false);
            setShowCategoriesMenu(false);
            setShowStoresMenu(false);
          }}
        />
      )}

      {/* Coupons Menu */}
      {showCouponsMenu && (
        <div className="coupons-context-menu" ref={couponsMenuRef}>
          <div className="coupons-menu-header">
            <span className="material-symbols-sharp">local_offer</span>
            <h3>{t('coupons', { defaultValue: 'Coupons & Deals' })}</h3>
          </div>

          <div className="coupons-menu-items">
            {couponsLoading ? (
              <div className="menu-loading">
                <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="menu-empty">
                <span className="material-symbols-sharp empty-icon">local_offer</span>
                <p>{language === 'ar' ? 'لا توجد كوبونات متاحة' : 'No coupons available'}</p>
                <Link 
                  href={`/${locale}/coupons`}
                  className="browse-link"
                  onClick={() => setShowCouponsMenu(false)}
                >
                  {language === 'ar' ? 'تصفح جميع الكوبونات' : 'Browse all coupons'}
                </Link>
              </div>
            ) : (
              <>
                {coupons.map((coupon) => (
                  <Link 
                    key={coupon.id}
                    href={`/${locale}/coupon/${coupon.slug || coupon.id}`}
                    className="coupon-menu-item"
                    onClick={() => setShowCouponsMenu(false)}
                  >
                    <div className="coupon-logo-wrapper">
                      {coupon.storeLogo ? (
                        <Image
                          src={coupon.storeLogo}
                          alt={coupon.storeName || 'Store'}
                          width={40}
                          height={40}
                          className="coupon-store-logo"
                        />
                      ) : (
                        <span className="material-symbols-sharp">storefront</span>
                      )}
                    </div>
                    <div className="coupon-info">
                      <span className="coupon-title">{coupon.title}</span>
                      <span className="coupon-store">{coupon.storeName}</span>
                      {coupon.expiryDate && (
                        <span className="coupon-expiry">
                          {language === 'ar' ? 'ينتهي' : 'Expires'} {new Date(coupon.expiryDate).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-sharp menu-arrow">chevron_right</span>
                  </Link>
                ))}
                <Link 
                  href={`/${locale}/coupons`}
                  className="view-all-link"
                  onClick={() => setShowCouponsMenu(false)}
                >
                  <span>{language === 'ar' ? 'عرض جميع الكوبونات' : 'View all coupons'}</span>
                  <span className="material-symbols-sharp">arrow_forward</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Categories Menu - GRID LAYOUT */}
      {showCategoriesMenu && (
        <div className="categories-context-menu" ref={categoriesMenuRef}>
          <div className="categories-menu-header">
            <span className="material-symbols-sharp">category</span>
            <h3>{t('categories', { defaultValue: 'Categories' })}</h3>
          </div>

          <div className="categories-grid-container">
            {categoriesLoading ? (
              <div className="menu-loading" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="menu-empty" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                <span className="material-symbols-sharp empty-icon">category</span>
                <p>{language === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available'}</p>
              </div>
            ) : (
              <>
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    href={`/${locale}/stores?category=${cat.slug}`}
                    className="category-grid-item"
                    onClick={() => setShowCategoriesMenu(false)}
                  >
                    <div className="category-image-wrapper">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          width={48}
                          height={48}
                          className="category-image"
                          sizes="(max-width: 375px) 42px, 48px"
                        />
                      ) : (
                        <span className="material-symbols-sharp category-icon-fallback">
                          {cat.icon || 'category'}
                        </span>
                      )}
                    </div>
                    <span className="category-name-grid">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Stores Menu */}
      {showStoresMenu && (
        <div className="stores-context-menu" ref={storesMenuRef}>
          <div className="stores-menu-header">
            <span className="material-symbols-sharp">storefront</span>
            <h3>{t('stores', { defaultValue: 'Stores' })}</h3>
          </div>

          <div className="stores-menu-items">
            {storesLoading ? (
              <div className="menu-loading">
                <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : stores.length === 0 ? (
              <div className="menu-empty">
                <span className="material-symbols-sharp empty-icon">storefront</span>
                <p>{language === 'ar' ? 'لا توجد متاجر متاحة' : 'No stores available'}</p>
              </div>
            ) : (
              <>
                {stores.map((store) => (
                  <Link 
                    key={store.id}
                    href={`/${locale}/stores/${store.slug}`}
                    className="store-menu-item"
                    onClick={() => setShowStoresMenu(false)}
                  >
                    <div className="store-logo-wrapper">
                      {store.logo ? (
                        <Image
                          src={store.logo}
                          alt={store.name}
                          width={40}
                          height={40}
                          className="store-logo-img"
                        />
                      ) : (
                        <span className="material-symbols-sharp">storefront</span>
                      )}
                    </div>
                    <div className="store-info">
                      <span className="store-name">{store.name}</span>
                      {store._count?.vouchers > 0 && (
                        <span className="store-voucher-count">
                          {store._count.vouchers} {language === 'ar' ? 'كوبون' : 'coupon'}
                          {store._count.vouchers !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-sharp menu-arrow">chevron_right</span>
                  </Link>
                ))}
                <Link 
                  href={`/${locale}/stores`}
                  className="view-all-link"
                  onClick={() => setShowStoresMenu(false)}
                >
                  <span>{language === 'ar' ? 'عرض جميع المتاجر' : 'View all stores'}</span>
                  <span className="material-symbols-sharp">arrow_forward</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <nav className="mobile-footer">
        <div className="mobile-footer-container">
          {/* Home */}
          <Link 
            className={`footer-item ${isActive('/home') || pathname === `/${locale}` ? 'active' : ''}`}
            href={`/${locale}`}
          >
            <span className="material-symbols-sharp">home</span>
            <span className="footer-label">{t('home', { defaultValue: 'Home' })}</span>
          </Link>

          {/* Stores */}
          <button 
            className={`footer-item ${showStoresMenu ? 'active' : ''}`}
            onClick={handleStoresClick}
          >
            <span className="material-symbols-sharp">storefront</span>
            <span className="footer-label">{t('stores', { defaultValue: 'Stores' })}</span>
          </button>
          
          {/* Categories */}
          <button 
            className={`footer-item ${showCategoriesMenu ? 'active' : ''}`}
            onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
          >
            <span className="material-symbols-sharp">category</span>
            <span className="footer-label">{t('categories', { defaultValue: 'Categories' })}</span>
          </button>

          {/* Coupons */}
          <Link 
            className={`footer-item ${isActive('/coupons') || pathname === `/${locale}/coupons` ? 'active' : ''}`}
            href={`/${locale}/coupons`}
          >
            <span className="material-symbols-sharp">local_offer</span>
            <span className="footer-label">{t('coupons', { defaultValue: 'Coupons' })}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileFooter;
