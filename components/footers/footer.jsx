// components/footers/footer.jsx - UPDATED FOR DYNAMIC STRUCTURE
"use client";
import React from 'react';
import './footer.css';
import coubonatLogo from '../../public/coubonat.png'
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const supportedLocales = ['en-SA', 'ar-SA']; // Define your list
  
  if (!supportedLocales.includes(locale)) return null;;
  const [language] = locale.split('-');
  
  const logoSrc = coubonatLogo;

  return (
    <footer className='footer'>
      <div className='main_footer'>
        <div className='footer_container'>
          {/* Company Info - Logo and Social Links Only */}
          <div className='footer_block company_info'>
            <Link href={`/${locale}`}>
              <Image 
                className='footer_logo' 
                src={logoSrc} 
                width={180} 
                height={42} 
                alt={t('logoAlt', { defaultValue: 'Logo' })}
              />
            </Link>
            
            <div className='footer_social_links'>
              <a 
                href="https://t.me/yourChannel" 
                className='footer_social_link_btn' 
                aria-label="Telegram" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-telegram"></i>
              </a>
              <a 
                href="https://facebook.com/yourPage" 
                className='footer_social_link_btn' 
                aria-label="Facebook" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a 
                href="https://instagram.com/yourProfile" 
                className='footer_social_link_btn' 
                aria-label="Instagram" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a 
                href="https://tiktok.com/@yourProfile" 
                className='footer_social_link_btn' 
                aria-label="TikTok" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="bi bi-tiktok"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className='footer_bottom'>
        <div className='footer_bottom_container'>
          <div className='footer_copyright'>
            <p>{t('copyright', { defaultValue: '© 2025 Coubonat. All rights reserved.' })}</p>
            <p className='footer_disclaimer'>
              {t('footerDisclaimer', { 
                defaultValue: 'Coubonat is an affiliate platform. We may earn commissions from purchases made through our links. All trademarks belong to their respective owners.' 
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
