// components/seo/CanonicalUrl.jsx - Canonical URL and Alternate Links
'use client';

import { usePathname } from 'next/navigation';
import Head from 'next/head';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';

/**
 * Generates canonical and alternate hreflang links
 */
export default function CanonicalUrl({ locale }) {
  const pathname = usePathname();
  
  // Remove locale from pathname to get base path
  const basePath = pathname.replace(/^\/[a-z]{2}-[A-Z]{2}/, '');
  
  const locales = [
    'ar-SA', 'en-SA',
    'ar-AE', 'en-AE',
    'ar-EG', 'en-EG',
    'ar-QA', 'en-QA',
    'ar-KW', 'en-KW',
    'ar-OM', 'en-OM'
  ];
  
  return (
    <Head>
      {/* Canonical URL */}
      <link rel="canonical" href={`${BASE_URL}/${locale}${basePath}`} />
      
      {/* Alternate Language Links */}
      {locales.map(loc => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`${BASE_URL}/${loc}${basePath}`}
        />
      ))}
      
      {/* x-default for international */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}/ar-SA${basePath}`}
      />
    </Head>
  );
}