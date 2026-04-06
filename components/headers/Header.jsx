'use client';
// components/headers/Header.jsx
// Changes vs previous version:
//  - Logo switching is CSS-only (no JS resize listener)
//  - Tablet (768-1024px) gets a compact horizontal nav strip instead of nothing
//  - Locale dropdown uses max-width + transform so it never clips off screen
//  - Removed the redundant bubs_container.desktop class
//  - Locale toggle shows flag + region code on all screen sizes

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import coubonatLogo from '../../public/cobonat.webp';
import coubonatCompactLogo from '../../public/cobonat-compact.webp';
import AnimatedSearchInput from '../SmartSearchInput/AnimatedSearchInput';
import './header.css';

const Header = () => {
  const t = useTranslations('Header');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [currentLanguage, currentRegion] = currentLocale.split('-');
  const isArabic = currentLanguage === 'ar';
  const languageCode = currentLanguage === 'ar' ? 'AR' : 'EN';

  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const localeMenuRef = useRef(null);

  // Fetch active countries
  useEffect(() => {
    fetch(`/api/countries?locale=${currentLanguage}`)
      .then(r => r.ok ? r.json() : { countries: [] })
      .then(data => {
        setCountries(Array.isArray(data.countries) ? data.countries : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentLanguage]);

  // Close locale menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target)) {
        setShowLocaleMenu(false);
      }
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

  // Navigation links — used both in desktop strip and tablet strip
  const navLinks = useMemo(() => [
    { href: '/coupons', label: t('deals')  || 'Deals'  },
    { href: '/stores',  label: t('stores') || 'Stores' },
    { href: '/blog',    label: t('blog')   || 'Blog'   },
    { href: '/help',    label: t('help')   || 'Help'   },
    { href: '/about',   label: t('about')  || 'About'  },
  ], [t]);

  // Handle locale switch with slug translation for dynamic routes
  const handleLocaleChange = useCallback(async (newLocale) => {
    if (currentLocale === newLocale) { setShowLocaleMenu(false); return; }
    setTranslating(true);

    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    const [newLanguage] = newLocale.split('-');
    const storeMatch    = pathWithoutLocale.match(/^\/stores\/([^/]+)/);
    const categoryMatch = pathWithoutLocale.match(/^\/categories\/([^/]+)/);

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

          {/* Logo — CSS controls which image shows per breakpoint */}
          <div className="logo_container">
            <Link href={`/${currentLocale}`} aria-label="Cobonat home">
              <Image className="logo logo--full"    src={coubonatLogo}        width={130} height={30} alt="Cobonat" priority />
              <Image className="logo logo--compact" src={coubonatCompactLogo} width={36}  height={36} alt="Cobonat" priority />
            </Link>
          </div>

          {/* Desktop nav (≥1025px) */}
          <nav className="header_nav header_nav--desktop" aria-label="Primary navigation">
            {navLinks.map(link => (
              <Link key={link.href} href={`/${currentLocale}${link.href}`} className="nav-link">
                {link.label}
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
          {navLinks.map(link => (
            <Link key={link.href} href={`/${currentLocale}${link.href}`} className="tablet-nav__link">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
