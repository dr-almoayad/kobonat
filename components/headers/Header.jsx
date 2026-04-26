'use client';
// components/headers/Header.jsx
// Updates:
//  - Desktop/tablet: Categories link added to nav
//  - Mobile: Hamburger button (logo | search | hamburger) + slide-in drawer
//  - Drawer: all pages + categories accordion grid + locale switcher

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

// ── Static seasonal links ─────────────────────────────────────────────────────
const SEASONAL_LINKS = [
  { slug: 'white_friday',   icon: '🎄', priority: 1 },
  { slug: 'ramadan',        icon: '🌙', priority: 2 },
  { slug: 'eid_al_fitr',    icon: '🕌', priority: 3 },
  { slug: 'eid_al_adha',    icon: '🐏', priority: 4 },
  { slug: 'summer_sale',    icon: '☀️',  priority: 5 },
  { slug: 'back_to_school', icon: '📚', priority: 6 },
  { slug: 'national_day',   icon: '🇸🇦', priority: 7 },
  { slug: 'year_end',       icon: '🎆', priority: 8 },
];

function getSeasonalTitle(slug, locale) {
  const titles = {
    white_friday:    { ar: 'الجمعة البيضاء',  en: 'White Friday'   },
    ramadan:         { ar: 'رمضان',           en: 'Ramadan'        },
    eid_al_fitr:     { ar: 'عيد الفطر',       en: 'Eid al-Fitr'    },
    eid_al_adha:     { ar: 'عيد الأضحى',      en: 'Eid al-Adha'    },
    summer_sale:     { ar: 'تخفيضات الصيف',   en: 'Summer Sale'    },
    back_to_school:  { ar: 'العودة للمدارس',  en: 'Back to School' },
    national_day:    { ar: 'اليوم الوطني',    en: 'National Day'   },
    year_end:        { ar: 'نهاية السنة',     en: 'Year End'       },
  };
  const lang = locale.startsWith('ar') ? 'ar' : 'en';
  return titles[slug]?.[lang] || slug.replace(/_/g, ' ');
}

// ── Header component ──────────────────────────────────────────────────────────

const Header = () => {
  const t = useTranslations('Header');
  const currentLocale = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  const [currentLanguage, currentRegion] = currentLocale.split('-');
  const isArabic     = currentLanguage === 'ar';
  const languageCode = currentLanguage === 'ar' ? 'AR' : 'EN';

  // Locale dropdown
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const localeMenuRef = useRef(null);

  // Mobile drawer
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [catsExpanded, setCatsExpanded]       = useState(false);
  const drawerRef = useRef(null);

  // Data
  const [countries,     setCountries]     = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [seasonalPages, setSeasonalPages] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [translating,   setTranslating]   = useState(false);

  // Fetch countries + seasonal nav pages + categories
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/countries?locale=${currentLanguage}`)
        .then(r => r.ok ? r.json() : { countries: [] }),
      fetch(`/api/seasonal?locale=${currentLanguage}&nav=1`)
        .then(r => r.ok ? r.json() : []),
      fetch(`/api/categories?locale=${currentLanguage}&country=${currentRegion}`)
        .then(r => r.ok ? r.json() : []),
    ]).then(([countryData, seasonalData, catData]) => {
      if (!mounted) return;
      setCountries(Array.isArray(countryData.countries) ? countryData.countries : []);
      setSeasonalPages(Array.isArray(seasonalData) ? seasonalData : []);
      setCategories(
        (Array.isArray(catData) ? catData : [])
          .filter(c => (c._count?.stores || 0) > 0)
          .sort((a, b) => (b._count?.stores || 0) - (a._count?.stores || 0))
          .slice(0, 18)
      );
      setLoading(false);
    }).catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [currentLanguage, currentRegion]);

  // Close locale dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target))
        setShowLocaleMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Sync direction
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

  // Nav links (desktop/tablet)
  const staticNavLinks = useMemo(() => [
    { href: '/coupons',                    label: t('deals') || 'Deals',               icon: 'local_offer',      extra: '' },
    { href: '/stacks',                     label: isArabic ? 'اجمع ووفر' : 'Stack & Save', icon: 'bolt',          extra: 'stacks' },
    { href: '/categories',                 label: isArabic ? 'الفئات' : 'Categories',  icon: 'grid_view' },
    { href: '/bank-and-payment-offers',    label: isArabic ? 'عروض البنوك' : 'Bank Offers', icon: 'account_balance', extra: 'bank' },
    { href: '/stores',                     label: t('stores') || 'Stores',             icon: 'storefront',       extra: '' },
    { href: '/blog',                       label: t('blog') || 'Blog',                 icon: 'article',          extra: '' },
    { href: '/help',                       label: t('help') || 'Help',                 icon: 'help',             extra: '' },
  ], [t, isArabic]);

  const allNavLinks = useMemo(() => [
    ...staticNavLinks,
    ...seasonalPages.map(sp => ({
      href:       `/seasonal/${sp.slug}`,
      label:      sp.title,
      icon:       'celebration',
      isLive:     sp.isLive,
      isSeasonal: true,
      extra:      'seasonal',
    })),
  ], [staticNavLinks, seasonalPages]);

  // Locale switch handler
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
            setDrawerOpen(false);
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
    setDrawerOpen(false);
    setTranslating(false);
  }, [currentLocale, pathname, router, currentLanguage]);

  const handleRegionChange   = (code) => handleLocaleChange(`${currentLanguage}-${code}`);
  const handleLanguageChange = (code) => handleLocaleChange(`${code}-${currentRegion}`);

  // All drawer links (main pages)
  const drawerMainLinks = [
    { href: '/',                            label: isArabic ? 'الرئيسية' : 'Home',                   icon: 'home',           extra: '' },
    { href: '/coupons',                     label: isArabic ? 'الكوبونات' : 'Coupons',               icon: 'local_offer',    extra: '' },
    { href: '/stacks',                      label: isArabic ? 'اجمع ووفر' : 'Stack & Save',         icon: 'bolt',           extra: 'stacks' },
    { href: '/bank-and-payment-offers',     label: isArabic ? 'عروض البنوك والدفع' : 'Bank & Payment Offers', icon: 'account_balance', extra: 'bank' },
    { href: '/stores',                      label: isArabic ? 'المتاجر' : 'Stores',                  icon: 'storefront',     extra: '' },
    { href: '/blog',                        label: isArabic ? 'المدونة' : 'Blog',                    icon: 'article',        extra: '' },
    { href: '/help',                        label: isArabic ? 'المساعدة' : 'Help Center',            icon: 'help',           extra: '' },
    { href: '/about',                       label: isArabic ? 'عن كوبونات' : 'About Us',             icon: 'info',           extra: '' },
    { href: '/contact',                     label: isArabic ? 'تواصل معنا' : 'Contact',              icon: 'mail',           extra: '' },
  ];

  const drawerLegalLinks = [
    { href: '/privacy', label: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy',  icon: 'shield' },
    { href: '/terms',   label: isArabic ? 'الشروط والأحكام' : 'Terms of Service', icon: 'gavel'  },
    { href: '/cookies', label: isArabic ? 'سياسة الكوكيز' : 'Cookie Policy',    icon: 'cookie' },
  ];

  const seasonalLinksSorted = [...SEASONAL_LINKS].sort((a, b) => a.priority - b.priority);

  return (
    <>
      <header>
        {/* ── Main bar ── */}
        <div className="main_header">
          <div className="header_container">

            {/* Logo */}
            <div className="logo_container">
              <Link href={`/${currentLocale}`} aria-label="Cobonat home">
                {isArabic
                  ? <Image className="logo logo--full"    src={coubonatLogoArabic}  width={130} height={30} alt="Cobonat" priority />
                  : <Image className="logo logo--full"    src={coubonatLogo}        width={130} height={30} alt="Cobonat" priority />
                }
                <Image className="logo logo--compact" src={coubonatCompactLogo} width={36} height={36} alt="Cobonat" priority />
              </Link>
            </div>

            {/* Desktop nav (≥1025px) */}
            <nav className="header_nav--desktop" aria-label="Primary navigation">
              {allNavLinks.map(link => (
                <Link
                  key={link.href}
                  href={`/${currentLocale}${link.href}`}
                  className={`nav-link${link.extra ? ` nav-link--${link.extra}` : ''}${link.isSeasonal ? ' nav-link--seasonal' : ''}`}
                >
                  {link.extra === 'stacks' && (
                    <span className="nav-link__icon">✨</span>
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

            {/* Locale selector (desktop/tablet only) */}
            <div className="locale-selector-wrapper" ref={localeMenuRef}>
              <button
                className="locale-toggle"
                onClick={() => setShowLocaleMenu(v => !v)}
                aria-label="Change language and region"
                aria-expanded={showLocaleMenu}
                disabled={translating}
              >
                {currentCountry?.flag && (
                  <Image src={currentCountry.flag} width={70} height={40} className="locale-flag" alt={currentCountry.name || currentRegion} />
                )}
                <span className="locale-code">{translating ? '…' : languageCode}</span>
              </button>

              {showLocaleMenu && !translating && (
                <div className="locale-dropdown" role="dialog" aria-label="Select language and region">
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
                              <Image src={country.flag} width={70} height={40} className="region-flag" alt={country.name} />
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

            {/* Hamburger (mobile only) */}
            <button
              className={`hamburger-btn${drawerOpen ? ' open' : ''}`}
              onClick={() => setDrawerOpen(v => !v)}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
            >
              <span className="material-symbols-sharp">
                {drawerOpen ? 'close' : 'menu'}
              </span>
            </button>

          </div>
        </div>

        {/* ── Tablet nav strip (768–1024px) ── */}
        <nav className="tablet-nav" aria-label="Tablet navigation">
          <div className="tablet-nav__inner">
            {allNavLinks.map(link => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className={`tablet-nav__link${link.isLive ? ' tablet-nav__link--live' : ''}${link.extra ? ` tablet-nav__link--${link.extra}` : ''}`}
              >
                {link.extra === 'stacks' && (
                  <span className="material-symbols-sharp tablet-nav__icon">bolt</span>
                )}
                {link.extra === 'categories' && (
                  <span className="material-symbols-sharp tablet-nav__icon">grid_view</span>
                )}
                {link.label}
                {link.isLive && <span className="nav-live-dot" aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer overlay ── */}
      <div
        className={`drawer-overlay${drawerOpen ? ' visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer panel ── */}
      <nav
        className={`mobile-drawer${drawerOpen ? ' open' : ''}`}
        ref={drawerRef}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
      >
        {/* Drawer header */}
        <div className="drawer-header">
          <Link
            href={`/${currentLocale}`}
            className="drawer-header-logo"
            onClick={() => setDrawerOpen(false)}
          >
            {isArabic
              ? <Image src={coubonatLogoArabic} width={110} height={26} alt="Cobonat" priority />
              : <Image src={coubonatLogo}        width={110} height={26} alt="Cobonat" priority />
            }
          </Link>
          <button
            className="drawer-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <span className="material-symbols-sharp">close</span>
          </button>
        </div>

        {/* Drawer body */}
        <div className="drawer-body">

          {/* ── Main pages ── */}
          <div className="drawer-section">
            <div className="drawer-section-label">
              {isArabic ? 'الصفحات' : 'Pages'}
            </div>

            {drawerMainLinks.map(link => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className={`drawer-link${link.extra ? ` drawer-link--${link.extra}` : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <span className="material-symbols-sharp">{link.icon}</span>
                {link.label}
                {link.extra === 'stacks' && (
                  <span className="drawer-link-badge drawer-link-badge--new">
                    {isArabic ? 'جديد' : 'New'}
                  </span>
                )}
                {link.extra === 'bank' && (
                  <span className="drawer-link-badge drawer-link-badge--new">
                    {isArabic ? 'مميز' : 'Hot'}
                  </span>
                )}
              </Link>
            ))}

            {/* Categories accordion toggle */}
            <button
              className="drawer-categories-toggle"
              onClick={() => setCatsExpanded(v => !v)}
              aria-expanded={catsExpanded}
            >
              <span className="material-symbols-sharp">grid_view</span>
              {isArabic ? 'الفئات' : 'Categories'}
              <span className={`material-symbols-sharp drawer-categories-chevron${catsExpanded ? ' rotated' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Categories panel */}
            <div className={`drawer-categories-panel${catsExpanded ? ' open' : ''}`}>
              {loading ? (
                <p style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                  {isArabic ? 'جاري التحميل…' : 'Loading…'}
                </p>
              ) : categories.length > 0 ? (
                <>
                  <div className="drawer-categories-grid">
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/${currentLocale}/categories/${cat.slug}`}
                        className="drawer-category-item"
                        onClick={() => setDrawerOpen(false)}
                      >
                        <div className="drawer-category-icon">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} />
                          ) : (
                            <span className="material-symbols-sharp">{cat.icon || 'category'}</span>
                          )}
                        </div>
                        <span className="drawer-category-name">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/${currentLocale}/categories`}
                    className="drawer-view-all-cats"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className="material-symbols-sharp">grid_view</span>
                    {isArabic ? 'كل الفئات' : 'All Categories'}
                    <span className="material-symbols-sharp" style={{ marginInlineStart: 'auto' }}>
                      {isArabic ? 'arrow_back' : 'arrow_forward'}
                    </span>
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          {/* ── Seasonal events ── */}
          {seasonalLinksSorted.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-label">
                {isArabic ? 'فعاليات موسمية' : 'Seasonal Events'}
              </div>
              {seasonalLinksSorted.map(link => {
                const liveEntry = seasonalPages.find(sp => sp.slug === link.slug);
                return (
                  <Link
                    key={link.slug}
                    href={`/${currentLocale}/seasonal/${link.slug}`}
                    className="drawer-link drawer-link--seasonal"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span style={{ fontSize: '1.125rem', lineHeight: 1, flexShrink: 0 }}>{link.icon}</span>
                    {getSeasonalTitle(link.slug, currentLocale)}
                    {liveEntry?.isLive && (
                      <span className="drawer-link-badge drawer-link-badge--live">
                        {isArabic ? 'الآن' : 'Live'}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Legal ── */}
          <div className="drawer-section">
            <div className="drawer-section-label">
              {isArabic ? 'قانوني' : 'Legal'}
            </div>
            {drawerLegalLinks.map(link => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className="drawer-link"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="material-symbols-sharp">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Locale (language + region) ── */}
          <div className="drawer-section">
            <div className="drawer-section-label">
              {isArabic ? 'اللغة والمنطقة' : 'Language & Region'}
            </div>

            {/* Language toggle */}
            <div className="drawer-locale">
              {allLanguages.map(lang => (
                <button
                  key={lang.code}
                  className={`drawer-locale-btn${currentLanguage === lang.code ? ' active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={translating}
                >
                  {lang.code === 'ar' ? '🇸🇦' : '🇬🇧'} {lang.name}
                </button>
              ))}
            </div>

            {/* Country buttons */}
            {!loading && countries.length > 0 && (
              <div className="drawer-locale" style={{ marginTop: '0.5rem' }}>
                {countries.map(country => (
                  <button
                    key={country.code}
                    className={`drawer-locale-btn${currentRegion === country.code ? ' active' : ''}`}
                    onClick={() => handleRegionChange(country.code)}
                    disabled={translating}
                  >
                    {country.flag && (
                      <Image
                        src={country.flag}
                        width={70}
                        height={40}
                        className="drawer-locale-flag"
                        alt={country.name}
                      />
                    )}
                    {country.name}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </nav>
    </>
  );
};

export default Header;
