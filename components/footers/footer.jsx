'use client';
// components/footers/footer.jsx
// Updates:
//  - Fetches seasonal pages with showInFooter=true and renders in dedicated section
//  - Adds Stacks link to Quick Links
//  - Mobile-first grid layout

import React, { useState, useEffect } from 'react';
import './footer.css';
import coubonatLogo from '../../public/cobonat.webp';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const [language, region] = locale.split('-');

  const [popularStores,  setPopularStores]  = useState([]);
  const [topCategories,  setTopCategories]  = useState([]);
  const [seasonalPages,  setSeasonalPages]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const sig = controller.signal;

    Promise.all([
      fetch(`/api/stores?limit=12&country=${region}&locale=${language}`,    { cache: 'no-store', signal: sig }),
      fetch(`/api/categories?locale=${language}&country=${region}`,         { cache: 'no-store', signal: sig }),
      fetch(`/api/seasonal?locale=${language}&footer=1`,                    { cache: 'no-store', signal: sig }),
    ])
      .then(async ([storesRes, catsRes, seasonalRes]) => {
        if (storesRes.ok) {
          const data = await storesRes.json();
          const all  = data.stores || [];
          const featured = all.filter(s => s.isFeatured).slice(0, 6);
          setPopularStores(featured.length >= 3 ? featured : all.slice(0, 6));
        }
        if (catsRes.ok) {
          const data = await catsRes.json();
          setTopCategories((Array.isArray(data) ? data : []).slice(0, 6));
        }
        if (seasonalRes.ok) {
          const data = await seasonalRes.json();
          setSeasonalPages(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [language, region]);

  const isAr = language === 'ar';

  return (
    <footer className="footer">
      <div className="main_footer">
        <div className="footer_container">

          {/* ── Brand ── */}
          <div className="footer_section footer_section--brand">
            <Link href={`/${locale}`} aria-label="Cobonat home">
              <Image className="footer_logo" src={coubonatLogo} width={160} height={38} alt="Cobonat" />
            </Link>
            <p className="footer_tagline">
              {isAr
                ? 'منصتك الأولى لأكواد الخصم والعروض في المنطقة.'
                : 'Your #1 source for verified coupons & deals in the region.'}
            </p>
            <div className="footer_social_links">
              <a href="https://t.me/cobonatme"                                className="footer_social_link_btn" aria-label="Telegram"  target="_blank" rel="noopener noreferrer"><i className="bi bi-telegram"  /></a>
              <a href="https://www.facebook.com/cobonatme"                    className="footer_social_link_btn" aria-label="Facebook"  target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook"  /></a>
              <a href="https://www.tiktok.com/@cobonatme"                     className="footer_social_link_btn" aria-label="TikTok"    target="_blank" rel="noopener noreferrer"><i className="bi bi-tiktok"    /></a>
              <a href="https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i" className="footer_social_link_btn" aria-label="WhatsApp"  target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp" /></a>
            </div>
          </div>

          {/* ── Popular Stores ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">storefront</span>
              {t('popularStores') || 'Popular Stores'}
            </h3>
            <ul className="footer_links">
              {loading
                ? <li className="footer_loading">{t('loading') || 'Loading…'}</li>
                : popularStores.length > 0
                ? <>
                    {popularStores.map(store => (
                      <li key={store.id}>
                        <Link href={`/${locale}/stores/${store.slug}`} className="footer_link">
                          {store.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/${locale}/stores`} className="footer_link_all">
                        {isAr ? 'جميع المتاجر ←' : 'View all stores →'}
                      </Link>
                    </li>
                  </>
                : <li className="footer_empty">{t('noStores') || 'No stores available'}</li>
              }
            </ul>
          </div>

          {/* ── Categories ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">category</span>
              {t('categories') || 'Categories'}
            </h3>
            <ul className="footer_links">
              {loading
                ? <li className="footer_loading">{t('loading') || 'Loading…'}</li>
                : topCategories.length > 0
                ? topCategories.map(cat => (
                    <li key={cat.id}>
                      <Link href={`/${locale}/categories/${cat.slug}`} className="footer_link">
                        {cat.name}
                      </Link>
                    </li>
                  ))
                : <li className="footer_empty">{t('noCategories') || 'No categories available'}</li>
              }
            </ul>
          </div>

          {/* ── Quick Links (includes Stacks) ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">link</span>
              {t('quickLinks') || 'Quick Links'}
            </h3>
            <ul className="footer_links">
              <li>
                <Link href={`/${locale}/stacks`} className="footer_link footer_link--stacks">
                  <span className="material-symbols-sharp">bolt</span>
                  {isAr ? 'اجمع ووفر' : 'Stack & Save'}
                </Link>
              </li>
              <li><Link href={`/${locale}/coupons`} className="footer_link"><span className="material-symbols-sharp">local_offer</span>{t('allCoupons')   || 'All Coupons'  }</Link></li>
              <li><Link href={`/${locale}/stores`}  className="footer_link"><span className="material-symbols-sharp">storefront</span>  {t('browseStores') || 'Browse Stores'}</Link></li>
              <li><Link href={`/${locale}/blog`}    className="footer_link"><span className="material-symbols-sharp">article</span>     {t('blog')         || 'Blog'         }</Link></li>
              <li><Link href={`/${locale}/help`}    className="footer_link"><span className="material-symbols-sharp">help</span>        {t('help')         || 'Help Center'  }</Link></li>
              <li><Link href={`/${locale}/about`}   className="footer_link"><span className="material-symbols-sharp">info</span>        {t('aboutUs')      || 'About Us'     }</Link></li>
              <li><Link href={`/${locale}/contact`} className="footer_link"><span className="material-symbols-sharp">mail</span>        {t('contact')      || 'Contact'      }</Link></li>
            </ul>
          </div>

          {/* ── Seasonal Pages (only when data exists) ── */}
          {!loading && seasonalPages.length > 0 && (
            <div className="footer_section">
              <h3 className="footer_section_title">
                <span className="material-symbols-sharp">celebration</span>
                {isAr ? 'مواسم وعروض' : 'Seasonal Deals'}
              </h3>
              <ul className="footer_links">
                {seasonalPages.map(sp => (
                  <li key={sp.id}>
                    <Link href={`/${locale}/seasonal/${sp.slug}`} className="footer_link footer_link--seasonal">
                      {sp.isLive && <span className="footer-live-dot" aria-hidden="true" />}
                      {sp.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Legal ── */}
          <div className="footer_section footer_section--legal">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">gavel</span>
              {t('legal') || 'Legal'}
            </h3>
            <ul className="footer_links">
              <li><Link href={`/${locale}/privacy`} className="footer_link">{t('privacy') || 'Privacy Policy'  }</Link></li>
              <li><Link href={`/${locale}/terms`}   className="footer_link">{t('terms')   || 'Terms of Service'}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="footer_link">{t('cookies') || 'Cookie Policy'   }</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer_bottom">
        <div className="footer_bottom_container">
          <p className="footer_copyright">
            {t('copyright') || `© ${new Date().getFullYear()} Cobonat. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
