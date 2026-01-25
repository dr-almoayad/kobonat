// app/[locale]/layout.js - FIXED SEO WITH PROPER CANONICAL URLS
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Header from "@/components/headers/Header";
import Footer from "@/components/footers/footer";
import SessionProviderWrapper from "@/components/SessionProviderComp";
import "@emran-alhaddad/saudi-riyal-font/index.css";
import MobileFooter from "@/components/footers/MobileFooter";
import SubBar from "@/components/headers/subBar";
import CategoryCarouselSubHeader from "@/components/headers/CategoryCarouselSubheader";
import { prisma } from "@/lib/prisma";
import { StoreProvider } from '@/contexts/StoreContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://coubonat.vercel.app';

// ✅ FIXED: Metadata with proper canonical URLs
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language, region] = locale.split('-');
  const isArabic = language === 'ar';
  
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isArabic 
        ? 'كوبونات وعروض - وفر المال في كل عملية شراء'
        : 'Coupons & Deals - Save Money on Every Purchase',
      template: isArabic 
        ? '%s | كوبونات'
        : '%s | Coupons Platform'
    },
    description: isArabic
      ? 'اعثر على أفضل الكوبونات وأكواد الخصم من أفضل المتاجر. وفر المال في كل عملية شراء مع أكواد خصم موثقة.'
      : 'Find the best coupons, promo codes, and deals from top stores. Save money on every purchase with verified discount codes.',
    applicationName: isArabic ? 'كوبونات' : 'Coupons Platform',
    authors: [{ name: 'Coubonat' }],
    generator: 'Next.js',
    keywords: isArabic 
      ? ['كوبونات', 'أكواد خصم', 'عروض', 'خصومات', 'توفير', region]
      : ['coupons', 'promo codes', 'deals', 'discounts', 'savings', region],
    referrer: 'origin-when-cross-origin',
    creator: 'Coubonat',
    publisher: 'Coubonat',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    
    // ✅ CRITICAL FIX: Proper alternates with locale in canonical
    alternates: {
      canonical: `${BASE_URL}/${locale}`, // Include locale!
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'ar-AE': `${BASE_URL}/ar-AE`,
        'en-AE': `${BASE_URL}/en-AE`,
        'ar-EG': `${BASE_URL}/ar-EG`,
        'en-EG': `${BASE_URL}/en-EG`,
        'ar-QA': `${BASE_URL}/ar-QA`,
        'en-QA': `${BASE_URL}/en-QA`,
        'ar-KW': `${BASE_URL}/ar-KW`,
        'en-KW': `${BASE_URL}/en-KW`,
        'ar-OM': `${BASE_URL}/ar-OM`,
        'en-OM': `${BASE_URL}/en-OM`,
        'x-default': `${BASE_URL}/ar-SA`,
      }
    },
    
    openGraph: {
      type: 'website',
      locale: locale,
      url: `${BASE_URL}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Coupons Platform',
      title: isArabic 
        ? 'كوبونات وعروض - وفر المال'
        : 'Coupons & Deals - Save Money',
      description: isArabic
        ? 'أفضل الكوبونات والعروض من المتاجر الرائدة'
        : 'Best coupons and deals from leading stores',
    },
    
    twitter: {
      card: 'summary_large_image',
      site: '@coubonat',
      creator: '@coubonat',
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    
    manifest: '/site.webmanifest',
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#470ae2',
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  
  const [language, countryCode] = locale.split('-');

  // Fetch featured stores for hero carousel
  let featuredStores = [];
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        coverImage: { not: null },
        countries: {
          some: {
            country: { 
              code: countryCode,
              isActive: true 
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale: language }
        }
      },
      take: 8,
      orderBy: { createdAt: 'desc' }
    });

    featuredStores = stores.map(store => ({
      id: store.id,
      name: store.translations[0]?.name || store.slug || '',
      logo: store.logo,
      coverImage: store.coverImage
    }));
  } catch (error) {
    console.error('Error fetching featured stores for hero:', error);
  }

  return (
    <html 
      lang={locale} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
        
        <link 
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@100..900&family=Open+Sans:wght@300..800&display=swap" 
          rel="stylesheet"
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": language === 'ar' ? 'كوبونات' : "Coupons Platform",
              "url": BASE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${BASE_URL}/${locale}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProviderWrapper>
            <StoreProvider>
              <Header featuredStores={featuredStores} />
              <CategoryCarouselSubHeader />
              {children}
            </StoreProvider>
            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
