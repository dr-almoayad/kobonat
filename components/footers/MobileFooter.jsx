// components/footers/MobileFooter.jsx - UPDATED FOR DYNAMIC STRUCTURE
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import './MobileFooter.css';

const MobileFooter = () => {
  const t = useTranslations('MobileFooter');
  const locale = useLocale();
  const [language, region] = locale.split('-');
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showStoresMenu, setShowStoresMenu] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);
  
  const accountMenuRef = useRef(null);
  const categoriesMenuRef = useRef(null);
  const storesMenuRef = useRef(null);

  // Category icon mapping
  const categoryIcons = {
    'fashion': 'checkroom',
    'electronics': 'devices',
    'beauty': 'face_retouching_natural',
    'home': 'home',
    'travel': 'flight',
    'sports': 'sports_soccer',
    'entertainment': 'sports_esports',
    'baby': 'stroller',
    'automotive': 'directions_car',
    'books': 'book',
    'default': 'category'
  };

  const getCategoryIcon = (category) => {
    const slug = category.slug?.toLowerCase() || '';
    
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (slug.includes(key)) {
        return icon;
      }
    }
    return category.icon || categoryIcons.default;
  };

  // Fetch ALL categories (no limit) - with country filtering
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?locale=${language}&country=${region}`, {
          cache: 'force-cache',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        
        if (isMounted) {
          const categoriesList = Array.isArray(data) ? data : (data.categories || []);
          
          if (Array.isArray(categoriesList)) {
            // Show ALL categories with stores in this country
            const validCategories = categoriesList.filter(cat => 
              cat._count?.stores > 0
            );
            setCategories(validCategories);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Category error:', error);
        if (isMounted) {
          setCategories([]);
          setLoading(false);
        }
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, [language, region]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target)) {
        setShowCategoriesMenu(false);
      }
      if (storesMenuRef.current && !storesMenuRef.current.contains(event.target)) {
        setShowStoresMenu(false);
      }
    };

    if (showAccountMenu || showCategoriesMenu || showStoresMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu, showCategoriesMenu, showStoresMenu]);

  // Fetch stores when menu opens
  const fetchStores = async () => {
    if (stores.length > 0) return;
    
    setStoresLoading(true);
    try {
      console.log('🏪 Fetching stores for:', { region, language });
      
      const url = `/api/stores?limit=10&country=${region}&locale=${language}`;
      console.log('📍 Fetching from URL:', url);
      
      const res = await fetch(url);
      
      console.log('📡 Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Store fetch failed:', errorText);
        throw new Error('Failed to fetch stores');
      }
      
      const data = await res.json();
      console.log('📦 Stores API response:', data);
      
      const storesList = data.stores || [];
      console.log('📊 Stores list:', storesList);
      console.log('📏 Stores count:', storesList.length);
      
      if (Array.isArray(storesList)) {
        setStores(storesList.slice(0, 10));
      } else {
        console.warn('⚠️ Stores list is not an array:', typeof storesList);
        setStores([]);
      }
    } catch (error) {
      console.error('❌ Error fetching stores:', error);
      console.error('Error details:', error.message);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleStoresClick = () => {
    if (!showStoresMenu) {
      fetchStores();
    }
    setShowStoresMenu(!showStoresMenu);
  };

  const isActive = (path) => pathname?.includes(path);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setShowAccountMenu(false);
    router.push(`/${locale}`);
  };

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    const newLocale = `${newLanguage}-${region}`;
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
    setShowAccountMenu(false);
  };

  return (
    <>
      {/* Overlay when menu is open */}
      {(showAccountMenu || showCategoriesMenu || showStoresMenu) && (
        <div 
          className="mobile-footer-overlay"
          onClick={() => {
            setShowAccountMenu(false);
            setShowCategoriesMenu(false);
            setShowStoresMenu(false);
          }}
        />
      )}

      {/* Categories Menu - ALL CATEGORIES */}
      {showCategoriesMenu && (
        <div className="categories-context-menu" ref={categoriesMenuRef}>
          <div className="categories-menu-header">
            <span className="material-symbols-sharp">category</span>
            <h3>{t('categories', { defaultValue: 'Categories' })}</h3>
          </div>

          <div className="categories-menu-items">
            {loading ? (
              <div className="menu-loading">
                <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="menu-empty">
                <span className="material-symbols-sharp empty-icon">category</span>
                <p>{language === 'ar' ? 'لا توجد فئات' : 'No categories'}</p>
              </div>
            ) : (
              <>
                {/* Show ALL categories */}
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    href={`/${locale}/stores?category=${cat.slug}`}
                    className="category-menu-item"
                    onClick={() => setShowCategoriesMenu(false)}
                  >
                    <span className="material-symbols-sharp category-icon">
                      {getCategoryIcon(cat)}
                    </span>
                    <span className="category-name">
                      {cat.name}
                    </span>
                    {cat._count?.stores > 0 && (
                      <span className="category-count">({cat._count.stores})</span>
                    )}
                    <span className="material-symbols-sharp menu-arrow">chevron_right</span>
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
                <p style={{ fontSize: '11px', color: '#999', marginTop: '0.5rem' }}>
                  {language === 'ar' 
                    ? `المنطقة: ${region} | اللغة: ${language}` 
                    : `Region: ${region} | Language: ${language}`}
                </p>
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
                          {store._count.vouchers} {language === 'ar' ? 'كوبون' : 'coupon'}{store._count.vouchers !== 1 ? 's' : ''}
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

      {/* Account Context Menu */}
      {showAccountMenu && (
        <div className="account-context-menu" ref={accountMenuRef}>
          <div className="account-menu-header">
            {session ? (
              <>
                <div className="user-avatar">
                  <span className="material-symbols-sharp">account_circle</span>
                </div>
                <div className="user-info">
                  <p className="user-name">{session.user?.name || t('user', { defaultValue: 'User' })}</p>
                  <p className="user-email">{session.user?.email}</p>
                </div>
              </>
            ) : (
              <div className="guest-header">
                <span className="material-symbols-sharp">person</span>
                <p>{t('welcome', { defaultValue: 'Welcome' })}</p>
              </div>
            )}
          </div>

          <div className="account-menu-divider" />

          <div className="account-menu-items">
            {session ? (
              <button 
                className="account-menu-item"
                onClick={handleSignOut}
              >
                <span className="material-symbols-sharp">logout</span>
                <span>{t('signOut', { defaultValue: 'Sign Out' })}</span>
              </button>
            ) : (
              <>
                <Link 
                  href={`/${locale}/auth/signin`}
                  className="account-menu-item"
                  onClick={() => setShowAccountMenu(false)}
                >
                  <span className="material-symbols-sharp">login</span>
                  <span>{t('signIn', { defaultValue: 'Sign In' })}</span>
                </Link>
                <Link 
                  href={`/${locale}/auth/signup`}
                  className="account-menu-item"
                  onClick={() => setShowAccountMenu(false)}
                >
                  <span className="material-symbols-sharp">person_add</span>
                  <span>{t('signUp', { defaultValue: 'Sign Up' })}</span>
                </Link>
              </>
            )}

            <div className="account-menu-divider" />

            <Link 
              href={`/${locale}/about`}
              className="account-menu-item"
              onClick={() => setShowAccountMenu(false)}
            >
              <span className="material-symbols-sharp">info</span>
              <span>{t('about', { defaultValue: 'About' })}</span>
            </Link>

            <Link 
              href={`/${locale}/contact`}
              className="account-menu-item"
              onClick={() => setShowAccountMenu(false)}
            >
              <span className="material-symbols-sharp">mail</span>
              <span>{t('contact', { defaultValue: 'Contact' })}</span>
            </Link>

            <Link 
              href={`/${locale}/terms`}
              className="account-menu-item"
              onClick={() => setShowAccountMenu(false)}
            >
              <span className="material-symbols-sharp">description</span>
              <span>{t('terms', { defaultValue: 'Terms' })}</span>
            </Link>

            <div className="account-menu-divider" />

            <button 
              className="account-menu-item"
              onClick={handleLanguageChange}
            >
              <span className="material-symbols-sharp">language</span>
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
              <span className="material-symbols-sharp menu-arrow">chevron_right</span>
            </button>
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

          {/* Account */}
          <Link 
            className={`footer-item ${isActive('/coupons') || pathname === `/${locale}/coupons` ? 'active' : ''}`}
            href={`/${locale}/coupons`}
          >
            <span className="material-symbols-sharp">local_activity</span>
            <span className="footer-label">{t('coupons', { defaultValue: 'Coupons' })}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileFooter;
