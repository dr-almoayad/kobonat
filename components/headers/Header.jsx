'use client';
// components/headers/Header.jsx
// Updates:
//  - Fetches seasonal pages with showInNav=true and renders them in nav
//  - Adds a Stacks page link
//  - Mobile-first: stacks appears in tablet strip + compact mobile menu
//  - Live seasonal pages get a subtle pulse indicator

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import coubonatLogo from '../../public/cobonat_logo.webp';
import coubonatLogoArabic from '../../public/cobonat_logo_arabic.webp';
import coubonatCompactLogo from '../../public/cobonat_logo_compact.webp';
import AnimatedSearchInput from '../SmartSearchInput/AnimatedSearchInput';
import './header.css';

const Header = () => {
  const t = useTranslations('Header');
  const currentLocale = useLocale();
  const router  = useRouter();
  const pathname = usePathname();

  const [currentLanguage, currentRegion] = currentLocale.split('-');
  const isArabic     = currentLanguage === 'ar';
  const languageCode = currentLanguage === 'ar' ? 'AR' : 'EN';

  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [countries,      setCountries]      = useState([]);
  const [seasonalPages,  setSeasonalPages]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [translating,    setTranslating]    = useState(false);
  const localeMenuRef = useRef(null);

  // Fetch countries + seasonal nav pages in parallel
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/countries?locale=${currentLanguage}`)
        .then(r => r.ok ? r.json() : { countries: [] }),
      fetch(`/api/seasonal?locale=${currentLanguage}&nav=1`)
        .then(r => r.ok ? r.json() : []),
    ]).then(([countryData, seasonalData]) => {
      if (!mounted) return;
      setCountries(Array.isArray(countryData.countries) ? countryData.countries : []);
      setSeasonalPages(Array.isArray(seasonalData) ? seasonalData : []);
      setLoading(false);
    }).catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [currentLanguage]);

  // Close locale menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target))
        setShowLocaleMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync document direction
  useEffect(() => {
    document.documentElement.dir  = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [isArabic, currentLanguage]);

  const currentCountry = useMemo(
    () => countries.find(c => c.code === currentRegion),
    [countries, currentRegion]
  );

  const allLanguages = [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
  ];

  // Static nav links — seasonal pages appended dynamically below
  const staticNavLinks = useMemo(() => [
    { href: '/coupons', label: t('deals')  || 'Deals', icon: '🔥'  },
    { href: '/stacks',  label: isArabic ? 'اجمع ووفر' : 'Stack & Save', icon: '✨' },
    { href: '/bank-and-payment-offers',  label: isArabic ? 'عروض البنوك والدفع' : 'Bank & Payment Offers', icon: '💸' },
    { href: '/stores',  label: t('stores') || 'Stores' },
    { href: '/blog',    label: t('blog')   || 'Blog'   },
    { href: '/help',    label: t('help')   || 'Help'   },
  ], [t, isArabic]);

  // Full nav: static + seasonal (nav-enabled)
  const allNavLinks = useMemo(() => [
    ...staticNavLinks,
    ...seasonalPages.map(sp => ({
      href:    `/seasonal/${sp.slug}`,
      label:   sp.title,
      isLive:  sp.isLive,
      isSeasonal: true,
    })),
  ], [staticNavLinks, seasonalPages]);

  // Handle locale switch
  const handleLocaleChange = useCallback(async (newLocale) => {
    if (currentLocale === newLocale) { setShowLocaleMenu(false); return; }
    setTranslating(true);

    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    const [newLanguage]     = newLocale.split('-');
    const storeMatch        = pathWithoutLocale.match(/^\/stores\/([^/]+)/);
    const categoryMatch     = pathWithoutLocale.match(/^\/categories\/([^/]+)/);

    if (storeMatch || categoryMatch) {
      const type        = storeMatch ? 'store' : 'category';
      const currentSlug = storeMatch ? storeMatch[1] : categoryMatch[1];
      try {
        const res = await fetch(
          `/api/translate-slug?type=${type}&slug=${encodeURIComponent(currentSlug)}&from=${currentLanguage}&to=${newLanguage}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.slug) {
            const base = type === 'store' ? '/stores/' : '/categories/';
            router.push(`/${newLocale}${base}${data.slug}`);
            setShowLocaleMenu(false);
            setTranslating(false);
            return;
          }
        }
      } catch {}
      router.push(`/${newLocale}`);
    } else {
      router.push(`/${newLocale}${pathWithoutLocale}`);
    }
    setShowLocaleMenu(false);
    setTranslating(false);
  }, [currentLocale, pathname, router, currentLanguage]);

  const handleRegionChange   = (code) => handleLocaleChange(`${currentLanguage}-${code}`);
  const handleLanguageChange = (code) => handleLocaleChange(`${code}-${currentRegion}`);

  return (
    <header>
      {/* ── Main bar ── */}
      <div className="main_header">
        <div className="header_container">

          {/* Logo */}
          <div className="logo_container">
            <Link href={`/${currentLocale}`} aria-label="Cobonat home">
              {isArabic ? 
                <Image className="logo logo--full"    src={coubonatLogoArabic}  width={130} height={30} alt="Cobonat" priority />
                :
                <Image className="logo logo--full"    src={coubonatLogo}        width={130} height={30} alt="Cobonat" priority />
              }
              <Image className="logo logo--compact" src={coubonatCompactLogo} width={36}  height={36} alt="Cobonat" priority />
            </Link>
          </div>

          {/* Desktop nav (≥1025px) */}
          <nav className="header_nav header_nav--desktop" aria-label="Primary navigation">
            {allNavLinks.map(link => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className={`nav-link${link.isSeasonal ? ' nav-link--seasonal' : ''}${link.href === '/stacks' ? ' nav-link--stacks' : ''}${link.href === '/coupons' ? ' nav-link--coupons' : ''}`}
              >
                {link.icon && (
                  <span className="nav-link__icon">{link.icon}</span>
                )}
                {link.label}
                {link.isLive && <span className="nav-live-dot" aria-hidden="true" />}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="searchbar_container">
            <AnimatedSearchInput currentLocale={currentLocale} currentLanguage={currentLanguage} />
          </div>

          {/* Locale selector */}
          <div className="locale-selector-wrapper" ref={localeMenuRef}>
            <button
              className="locale-toggle"
              onClick={() => setShowLocaleMenu(v => !v)}
              aria-label="Change language and region"
              aria-expanded={showLocaleMenu}
              disabled={translating}
            >
              {currentCountry?.flag && (
                <Image
                  src={currentCountry.flag}
                  width={70} height={40}
                  className="locale-flag"
                  alt={currentCountry.name || currentRegion}
                />
              )}
              <span className="locale-code">{translating ? '…' : languageCode}</span>
            </button>

            {showLocaleMenu && !translating && (
              <div className="locale-dropdown" role="dialog" aria-label="Select language and region">

                {/* Countries */}
                <div className="dropdown-section">
                  <div className="dropdown-section-header">
                    <span className="material-symbols-sharp">public</span>
                    <h3>{t('selectRegion') || 'Region'}</h3>
                  </div>
                  <div className="region-list">
                    {loading
                      ? <p className="dropdown-loading">{isArabic ? 'جاري التحميل…' : 'Loading…'}</p>
                      : countries.length === 0
                      ? <p className="dropdown-loading">{isArabic ? 'لا توجد دول' : 'No countries'}</p>
                      : countries.map(country => (
                          <button
                            key={country.id || country.code}
                            className={`region-item ${currentRegion === country.code ? 'active' : ''}`}
                            onClick={() => handleRegionChange(country.code)}
                          >
                            {country.flag && (
                              <Image src={country.flag} width={70} height={40}
                                className="region-flag" alt={country.name} />
                            )}
                            <div className="region-info">
                              <span className="region-name">{country.name}</span>
                              <span className="region-currency">{country.currency}</span>
                            </div>
                            {currentRegion === country.code && (
                              <span className="material-symbols-sharp check-icon">check</span>
                            )}
                          </button>
                        ))
                    }
                  </div>
                </div>

                {/* Languages */}
                <div className="dropdown-section">
                  <div className="dropdown-section-header">
                    <span className="material-symbols-sharp">translate</span>
                    <h3>{t('selectLanguage') || 'Language'}</h3>
                  </div>
                  <div className="lang-list">
                    {allLanguages.map(lang => (
                      <button
                        key={lang.code}
                        className={`lang-item ${currentLanguage === lang.code ? 'active' : ''}`}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        <span className="lang-name">{lang.name}</span>
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

      {/* ── Tablet nav strip (768–1024px) ── */}
      <nav className="tablet-nav" aria-label="Tablet navigation">
        <div className="tablet-nav__inner">
          {allNavLinks.map(link => (
            <Link
              key={link.href}
              href={`/${currentLocale}${link.href}`}
              className={`tablet-nav__link${link.isLive ? ' tablet-nav__link--live' : ''}${link.href === '/stacks' ? ' tablet-nav__link--stacks' : ''}`}
            >
              {link.icon && (
                <span className="material-symbols-sharp tablet-nav__icon">{link.icon}</span>
              )}
              {link.label}
              {link.isLive && <span className="nav-live-dot" aria-hidden="true" />}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
