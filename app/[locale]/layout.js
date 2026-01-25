// app/[locale]/layout.js - UPDATED WITH DYNAMIC HERO HEADER

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

// Metadata configuration
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'),
  title: {
    default: 'Coupons & Deals - Save Money on Every Purchase',
    template: '%s | Coupons Platform'
  },
  description: 'Find the best coupons, promo codes, and deals from top stores.',
  // ... rest of your metadata
};

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

  // ✅ FETCH FEATURED STORES FOR HERO CAROUSEL
  let featuredStores = [];
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        coverImage: { not: null }, // Only stores with cover images
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
      take: 8, // Limit to 8 featured stores
      orderBy: { createdAt: 'desc' }
    });

    // Transform for component
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
      dir={locale.startsWith('ar') ? 'rtl' : 'ltr'}
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
              "name": "Coupons Platform",
              "url": process.env.NEXT_PUBLIC_BASE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/search?q={search_term_string}`
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
            {/* ✅ PASS FEATURED STORES TO HEADER */}
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
