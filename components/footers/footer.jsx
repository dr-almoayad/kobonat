'use client';
// components/footers/footer.jsx
// Premium desktop footer – on mobile: 2‑col grid + logo at bottom (full width)
 
import React, { useState, useEffect } from 'react';
import './footer.css';
import coubonatLogo from '../../public/cobonat.webp';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

// Static seasonal links (same as mobile)
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

const Footer = () => {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const [language, region] = locale.split('-');
  const isAr = language === 'ar';

  const [popularStores, setPopularStores] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const sig = controller.signal;
    Promise.all([
      fetch(`/api/stores?limit=12&country=${region}&locale=${language}`, { cache: 'no-store', signal: sig }),
      fetch(`/api/categories?locale=${language}&country=${region}`, { cache: 'no-store', signal: sig }),
    ])
      .then(async ([storesRes, catsRes]) => {
        if (storesRes.ok) {
          const data = await storesRes.json();
          const all = data.stores || [];
          const featured = all.filter(s => s.isFeatured).slice(0, 6);
          setPopularStores(featured.length >= 3 ? featured : all.slice(0, 6));
        }
        if (catsRes.ok) {
          const data = await catsRes.json();
          setTopCategories((Array.isArray(data) ? data : []).slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [language, region]);

  const seasonalLinksSorted = [...SEASONAL_LINKS].sort((a, b) => a.priority - b.priority);

  return (
    <footer className="footer">
      <div className="main_footer">
        <div className="footer_container">

          {/* ── Popular Stores ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">storefront</span>
              {t('popularStores') || 'Popular Stores'}
            </h3>
            <ul className="footer_links">
              {loading ? (
                <li className="footer_loading">{t('loading') || 'Loading…'}</li>
              ) : popularStores.length > 0 ? (
                <>
                  {popularStores.map(store => (
                    <li key={store.id}>
                      <Link href={`/${locale}/stores/${store.slug}`} className="footer_link">{store.name}</Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/${locale}/stores`} className="footer_link_all">
                      {isAr ? 'جميع المتاجر ←' : 'View all stores →'}
                    </Link>
                  </li>
                </>
              ) : (
                <li className="footer_empty">{t('noStores') || 'No stores available'}</li>
              )}
            </ul>
          </div>

          {/* ── Categories ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">category</span>
              {t('categories') || 'Categories'}
            </h3>
            <ul className="footer_links">
              {loading ? (
                <li className="footer_loading">{t('loading') || 'Loading…'}</li>
              ) : topCategories.length > 0 ? (
                topCategories.map(cat => (
                  <li key={cat.id}>
                    <Link href={`/${locale}/categories/${cat.slug}`} className="footer_link">{cat.name}</Link>
                  </li>
                ))
              ) : (
                <li className="footer_empty">{t('noCategories') || 'No categories available'}</li>
              )}
            </ul>
          </div>

          {/* ── Seasonal Events (static priority list) ── */}
          <div className="footer_section">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">celebration</span>
              {isAr ? 'فعاليات موسمية' : 'Seasonal Events'}
            </h3>
            <ul className="footer_links">
              {seasonalLinksSorted.map(link => (
                <li key={link.slug}>
                  <Link href={`/${locale}/seasonal/${link.slug}`} className="footer_link footer_link--seasonal">
                    <span className="seasonal-icon">{link.icon}</span>
                    {getSeasonalTitle(link.slug, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Quick Links (Stack & Save prominent) ── */}
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
              <li><Link href={`/${locale}/coupons`} className="footer_link"><span className="material-symbols-sharp">local_offer</span>{t('allCoupons') || 'All Coupons'}</Link></li>
              <li><Link href={`/${locale}/stores`} className="footer_link"><span className="material-symbols-sharp">storefront</span>{t('browseStores') || 'Browse Stores'}</Link></li>
              <li><Link href={`/${locale}/blog`} className="footer_link"><span className="material-symbols-sharp">article</span>{t('blog') || 'Blog'}</Link></li>
              <li><Link href={`/${locale}/help`} className="footer_link"><span className="material-symbols-sharp">help</span>{t('help') || 'Help Center'}</Link></li>
              <li><Link href={`/${locale}/about`} className="footer_link"><span className="material-symbols-sharp">info</span>{t('aboutUs') || 'About Us'}</Link></li>
              <li><Link href={`/${locale}/contact`} className="footer_link"><span className="material-symbols-sharp">mail</span>{t('contact') || 'Contact'}</Link></li>
            </ul>
          </div>

          {/* ── Legal ── */}
          <div className="footer_section footer_section--legal">
            <h3 className="footer_section_title">
              <span className="material-symbols-sharp">gavel</span>
              {t('legal') || 'Legal'}
            </h3>
            <ul className="footer_links">
              <li><Link href={`/${locale}/privacy`} className="footer_link">{t('privacy') || 'Privacy Policy'}</Link></li>
              <li><Link href={`/${locale}/terms`} className="footer_link">{t('terms') || 'Terms of Service'}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="footer_link">{t('cookies') || 'Cookie Policy'}</Link></li>
            </ul>
          </div>

          {/* ── Brand / Logo – will be pushed to bottom on mobile (via CSS) ── */}
          <div className="footer_section footer_section--brand">
            <Link href={`/${locale}`} aria-label="Cobonat home">
              <Image className="footer_logo" src={coubonatLogo} width={200} height={48} alt="Cobonat" priority />
            </Link>
            <p className="footer_tagline">
              {isAr
                ? 'منصتك الأولى لأكواد الخصم والعروض في المنطقة.'
                : 'Your #1 source for verified coupons & deals in the region.'}
            </p>
            <div className="footer_social_links">
              <a href="https://t.me/cobonatme" className="footer_social_link_btn" aria-label="Telegram" target="_blank" rel="noopener noreferrer"><i className="bi bi-telegram" /></a>
              <a href="https://www.facebook.com/cobonatme" className="footer_social_link_btn" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook" /></a>
              <a href="https://www.tiktok.com/@cobonatme" className="footer_social_link_btn" aria-label="TikTok" target="_blank" rel="noopener noreferrer"><i className="bi bi-tiktok" /></a>
              <a href="https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i" className="footer_social_link_btn" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp" /></a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer_bottom">
        <div className="footer_bottom_container">
          <p className="footer_copyright">{t('copyright') || `© ${new Date().getFullYear()} Cobonat. All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
