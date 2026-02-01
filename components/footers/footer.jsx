// components/footers/footer.jsx - UPDATED WITH PAGE LINKS
"use client";
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
  
  const [popularStores, setPopularStores] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch popular stores and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesRes, categoriesRes] = await Promise.all([
          fetch(`/api/stores?limit=6&country=${region}&locale=${language}`, { cache: 'no-store' }),
          fetch(`/api/categories?locale=${language}&country=${region}`, { cache: 'no-store' })
        ]);

        if (storesRes.ok) {
          const storesData = await storesRes.json();
          const stores = storesData.stores || [];
          setPopularStores(stores.filter(s => s.isFeatured).slice(0, 6));
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const categories = Array.isArray(categoriesData) ? categoriesData : [];
          setTopCategories(categories.slice(0, 6));
        }
      } catch (error) {
        console.error('Footer data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, region]);

  const logoSrc = coubonatLogo;

  return (
    <footer className='footer'>
      <div className='main_footer'>
        <div className='footer_container'>
          
          {/* Company Info */}
          <div className='footer_section company_section'>
            <Link href={`/${locale}`}>
              <Image 
                className='footer_logo' 
                src={logoSrc} 
                width={180} 
                height={42} 
                alt={t('logoAlt', { defaultValue: 'Coubonat Logo' })}
              />
            </Link>
            
            <div className='footer_social_links'>
              <a 
                href="https://t.me/yourChannel" 
                className='footer_social_link_btn telegram' 
                aria-label="Telegram" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-telegram"></i>
              </a>
              <a 
                href="https://facebook.com/yourPage" 
                className='footer_social_link_btn facebook' 
                aria-label="Facebook" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a 
                href="https://instagram.com/yourProfile" 
                className='footer_social_link_btn instagram' 
                aria-label="Instagram" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a 
                href="https://tiktok.com/@yourProfile" 
                className='footer_social_link_btn tiktok' 
                aria-label="TikTok" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Popular Stores */}
          <div className='footer_section'>
            <h3 className='footer_section_title'>
              <span className="material-symbols-sharp">storefront</span>
              {t('popularStores', { defaultValue: 'Popular Stores' })}
            </h3>
            <ul className='footer_links'>
              {loading ? (
                <li className='footer_loading'>{t('loading', { defaultValue: 'Loading...' })}</li>
              ) : popularStores.length > 0 ? (
                <>
                  {popularStores.map((store) => (
                    <li key={store.id}>
                      <Link href={`/${locale}/stores/${store.slug}`} className='footer_link'>
                        {store.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/${locale}/stores`} className='footer_link_all'>
                      {t('viewAllStores', { defaultValue: 'View all stores' })} →
                    </Link>
                  </li>
                </>
              ) : (
                <li className='footer_empty'>{t('noStores', { defaultValue: 'No stores available' })}</li>
              )}
            </ul>
          </div>

          {/* Categories */}
          <div className='footer_section'>
            <h3 className='footer_section_title'>
              <span className="material-symbols-sharp">category</span>
              {t('categories', { defaultValue: 'Categories' })}
            </h3>
            <ul className='footer_links'>
              {loading ? (
                <li className='footer_loading'>{t('loading', { defaultValue: 'Loading...' })}</li>
              ) : topCategories.length > 0 ? (
                <>
                  {topCategories.map((category) => (
                    <li key={category.id}>
                      <Link href={`/${locale}/stores/${category.slug}`} className='footer_link'>
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </>
              ) : (
                <li className='footer_empty'>{t('noCategories', { defaultValue: 'No categories available' })}</li>
              )}
            </ul>
          </div>

          {/* Quick Links */}
          <div className='footer_section'>
            <h3 className='footer_section_title'>
              <span className="material-symbols-sharp">link</span>
              {t('quickLinks', { defaultValue: 'Quick Links' })}
            </h3>
            <ul className='footer_links'>
              <li>
                <Link href={`/${locale}/coupons`} className='footer_link'>
                  <span className="material-symbols-sharp">local_offer</span>
                  {t('allCoupons', { defaultValue: 'All Coupons' })}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/stores`} className='footer_link'>
                  <span className="material-symbols-sharp">storefront</span>
                  {t('browseStores', { defaultValue: 'Browse Stores' })}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className='footer_link'>
                  <span className="material-symbols-sharp">info</span>
                  {t('aboutUs', { defaultValue: 'About Us' })}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className='footer_link'>
                  <span className="material-symbols-sharp">mail</span>
                  {t('contact', { defaultValue: 'Contact' })}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className='footer_section'>
            <h3 className='footer_section_title'>
              <span className="material-symbols-sharp">gavel</span>
              {t('legal', { defaultValue: 'Legal' })}
            </h3>
            <ul className='footer_links'>
              <li>
                <Link href={`/${locale}/privacy`} className='footer_link'>
                  {t('privacy', { defaultValue: 'Privacy Policy' })}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className='footer_link'>
                  {t('terms', { defaultValue: 'Terms of Service' })}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cookies`} className='footer_link'>
                  {t('cookies', { defaultValue: 'Cookie Policy' })}
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <div className='footer_bottom'>
        <div className='footer_bottom_container'>
          <div className='footer_copyright'>
            <p>{t('copyright', { defaultValue: '© 2025 Coubonat. All rights reserved.' })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
