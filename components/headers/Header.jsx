// components/headers/Header.jsx - WITH SLUG TRANSLATION SUPPORT
'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import coubonatLogo from '../../public/cobonat.webp';
import AnimatedSearchInput from '../SmartSearchInput/AnimatedSearchInput';
import './header.css';

const Header = () => {
  const t = useTranslations("Header");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Parse current locale (e.g., "ar-SA" -> language: "ar", region: "SA")
  const [currentLanguage, currentRegion] = currentLocale.split('-');
  const currentDirection = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  
  const logoSrc = coubonatLogo;

  // State management
  const [showModal, setShowModal] = useState(false);
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const localeMenuRef = useRef(null);

  // Get language display code
  const languageCode = currentLanguage === 'ar' ? 'AR' : 'EN';

  // Fetch active countries from API
  useEffect(() => {
    async function fetchCountries() {
      try {
        console.log('🌍 Fetching countries for locale:', currentLanguage);
        
        const url = `/api/countries?locale=${currentLanguage}`;
        console.log('📍 Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response not OK:', response.status, response.statusText);
          console.error('❌ Error response body:', errorText);
          throw new Error(`Failed to fetch countries: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📦 Raw API response:', data);
        
        // Handle both response formats
        const countriesList = data.countries || data;
        
        console.log('📊 Countries list:', countriesList);
        console.log('📏 Countries count:', Array.isArray(countriesList) ? countriesList.length : 0);
        
        setCountries(Array.isArray(countriesList) ? countriesList : []);
      } catch (error) {
        console.error('❌ Error fetching countries:', error);
        console.error('Error details:', error.message);
        setCountries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, [currentLanguage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(event.target)) {
        setShowLocaleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set document direction based on locale
  useEffect(() => {
    document.documentElement.dir = currentDirection;
    document.documentElement.lang = currentLanguage;
  }, [currentDirection, currentLanguage]);

  // Get current country object
  const currentCountry = useMemo(() => {
    return countries.find(c => c.code === currentRegion);
  }, [countries, currentRegion]);

  // Available languages (hardcoded as they're not dynamic)
  const allLanguages = useMemo(() => [
    { code: 'ar', name: 'العربية', name_en: 'Arabic', direction: 'rtl' },
    { code: 'en', name: 'English', name_ar: 'الإنجليزية', direction: 'ltr' }
  ], []);

  // Get current language object
  const currentLanguageObj = useMemo(() => {
    return allLanguages.find(l => l.code === currentLanguage);
  }, [allLanguages, currentLanguage]);

  // Handle locale change with slug translation support
  const handleLocaleChange = useCallback(async (newLocale) => {
    if (currentLocale === newLocale) return;
    
    setTranslating(true);
    
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    const [newLanguage] = newLocale.split('-');
    
    // Check if we're on a dynamic route (stores/[slug] or categories/[slug])
    const storeMatch = pathWithoutLocale.match(/^\/stores\/([^\/]+)/);
    const categoryMatch = pathWithoutLocale.match(/^\/categories\/([^\/]+)/);
    
    if (storeMatch || categoryMatch) {
      const type = storeMatch ? 'store' : 'category';
      const currentSlug = storeMatch ? storeMatch[1] : categoryMatch[1];
      
      console.log(`🔄 Translating ${type} slug from ${currentLanguage} to ${newLanguage}:`, currentSlug);
      
      try {
        // Use dedicated translation endpoint
        const response = await fetch(
          `/api/translate-slug?type=${type}&slug=${encodeURIComponent(currentSlug)}&from=${currentLanguage}&to=${newLanguage}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('✅ Translation response:', data);
          
          if (data.success && data.slug) {
            // Build new path with translated slug
            const basePath = type === 'store' ? '/stores/' : '/categories/';
            const newPathname = `/${newLocale}${basePath}${data.slug}`;
            
            console.log('✅ Navigating to translated path:', newPathname);
            
            router.push(newPathname);
            setShowLocaleMenu(false);
            setTranslating(false);
            return;
          }
        }
        
        // If translation fails, redirect to homepage in new locale
        console.warn(`⚠️ Could not translate ${type} slug, redirecting to homepage`);
        router.push(`/${newLocale}`);
        setShowLocaleMenu(false);
        setTranslating(false);
        return;
        
      } catch (error) {
        console.error('❌ Error translating slug:', error);
        // Fallback to homepage
        router.push(`/${newLocale}`);
        setShowLocaleMenu(false);
        setTranslating(false);
        return;
      }
    }
    
    // For static routes, just change the locale prefix
    const newPathname = `/${newLocale}${pathWithoutLocale}`;
    console.log('📍 Navigating to static path:', newPathname);
    
    router.push(newPathname);
    setShowLocaleMenu(false);
    setTranslating(false);
  }, [currentLocale, pathname, router, currentLanguage]);

  // Handle region/country change
  const handleRegionChange = useCallback((countryCode) => {
    const newLocale = `${currentLanguage}-${countryCode}`;
    handleLocaleChange(newLocale);
  }, [currentLanguage, handleLocaleChange]);

  // Handle language change
  const handleLanguageChange = useCallback((languageCode) => {
    const newLocale = `${languageCode}-${currentRegion}`;
    handleLocaleChange(newLocale);
  }, [currentRegion, handleLocaleChange]);

  return (
    <header>
      <div className='main_header'>
        <div className='header_container'>
          {/* Logo */}
          <div className='logo_container'>       
            <Link href={`/${currentLocale}`}>
              <Image className='logo' src={logoSrc} width={130} height={30} alt='Logo' priority />
            </Link>
          </div>

          {/* Search - Center aligned */}
          <div className='searchbar_container'>
            <AnimatedSearchInput 
              currentLocale={currentLocale}
              currentLanguage={currentLanguage}
            />
          </div>
          
          {/* Right Side - Compact Locale Selector */}
          <div className='bubs_container desktop'>
            <div className="locale-selector-wrapper" ref={localeMenuRef}>
              <button 
                className='locale-toggle' 
                onClick={() => setShowLocaleMenu(!showLocaleMenu)}
                aria-label="Change language and region"
                disabled={translating}
              >
                {currentCountry?.flag && (
                  <Image 
                    src={currentCountry.flag} 
                    width={70} 
                    height={40} 
                    className="locale-flag"
                    alt={currentCountry.name}
                  />
                )}
                <span className="locale-name">
                  <span style={{margin: '0 2px', opacity: 0.6, fontSize: '10px'}}>|</span>
                  <span style={{fontSize: '11px'}}>
                    {translating ? '...' : languageCode}
                  </span>
                </span>
              </button>
              
              {/* Locale Dropdown */}
              {showLocaleMenu && !translating && (
                <div className="locale-dropdown">
                  {/* Countries Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-header">
                      <span className="material-symbols-sharp">public</span>
                      <h3>{t('selectRegion')}</h3>
                    </div>
                    <div className="region-list">
                      {loading ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                          {currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                        </div>
                      ) : countries.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            {currentLanguage === 'ar' ? 'لا توجد دول متاحة' : 'No countries available'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {currentLanguage === 'ar' 
                              ? 'يرجى الاتصال بالمسؤول لإضافة دول' 
                              : 'Please contact admin to add countries'}
                          </div>
                        </div>
                      ) : (
                        countries.map(country => (
                          <button
                            key={country.id || country.code}
                            className={`region-item ${currentRegion === country.code ? 'active' : ''}`}
                            onClick={() => handleRegionChange(country.code)}
                          >
                            {country.flag && (
                              <Image 
                                src={country.flag} 
                                width={70} 
                                height={40} 
                                className="region-flag"
                                alt={country.name}
                              />
                            )}
                            <div className="region-info">
                              <span className="region-name" style={{fontSize: '13px'}}>
                                {country.name}
                              </span>
                              <span className="region-currency" style={{fontSize: '11px'}}>
                                {country.currency}
                              </span>
                            </div>
                            {currentRegion === country.code && (
                              <span className="material-symbols-sharp check-icon">check</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Languages Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-header">
                      <span className="material-symbols-sharp">translate</span>
                      <h3>{t('selectLanguage')}</h3>
                    </div>
                    <div className="lang-list">
                      {allLanguages.map(lang => (
                        <button
                          key={lang.code}
                          className={`lang-item ${currentLanguage === lang.code ? 'active' : ''}`}
                          onClick={() => handleLanguageChange(lang.code)}
                        >
                          <span className="lang-name" style={{fontSize: '13px'}}>
                            {currentLanguage === 'ar' ? (lang.name_ar || lang.name) : lang.name}
                          </span>
                          {currentLanguage === lang.code && (
                            <span className="material-symbols-sharp check-icon">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Header;
