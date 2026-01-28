// app/[locale]/layout.js - FIXED CANONICAL URLS FOR SEO + GOOGLE ANALYTICS + LOCALE-SPECIFIC MANIFESTS
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
import CategoryCarouselSubHeader from "@/components/headers/CategoryCarouselSubHeader";
import Script from 'next/script';

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
const GA_MEASUREMENT_ID = 'G-EFNHSXWE0M';

// Default metadata (will be overridden by page-specific metadata)
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language, region] = locale.split('-');
  const isArabic = language === 'ar';
  
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isArabic 
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : 'Cobonat - Save More on Every Purchase',
      template: isArabic 
        ? '%s | كوبونات'
        : '%s | Coupons Platform'
    },
    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    applicationName: isArabic ? 'كوبونات' : 'Cobonat',
    authors: [{ name: 'Cobonat' }],
    generator: 'Next.js',
   const keywords = isArabic 
    ? ['كوبونات', 'أكواد خصم', 'عروض', 'خصومات', 'توفير', 'السعودية', 'كود خصم تويتر', 'شحن مجاني', 'كوبونات المشاهير', 'خصم أول طلب', 'أكواد مجربة']
    : ['Coupons', 'Promo Codes', 'Saudi Deals', 'Discount Codes', 'Free Shipping', 'First Order Code', 'Verified Coupons', 'KSA Offers'],
    referrer: 'origin-when-cross-origin',
    creator: 'Cobonat',
    publisher: 'Cobonat',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    
    // ✅ CRITICAL FIX: Proper alternates with locale in canonical
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      }
    },
    
    // Open Graph
    openGraph: {
      type: 'website',
      locale: locale,
      url: `${BASE_URL}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title: isArabic 
        ? "Cobonat | كوبونات - وفر أكثر على مشترياتك ومقاضيك!"
        : 'Cobonat - Save More on Every Purchase',
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
        : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
    },
    
    // Robots - Allow all locales
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
    
    // Icons
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    
    // ✅ UPDATED: Locale-specific manifest
    manifest: isArabic ? '/manifest-ar.webmanifest' : '/manifest-en.webmanifest',
  };
}

// Viewport configuration
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
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  return (
    <html 
      lang={locale} 
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

        {/* ✅ ADDED: Explicit manifest link for better browser support */}
        <link 
          rel="manifest" 
          href={isArabic ? '/manifest-ar.webmanifest' : '/manifest-en.webmanifest'} 
        />

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        
        {/* Material Symbols */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
        
        {/* Google Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@100..900&family=Open+Sans:wght@300..800&display=swap" 
          rel="stylesheet"
        />
        
        {/* Schema.org for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": isArabic ? 'كوبونات' : "Coupons Platform",
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
            <Header />
            <CategoryCarouselSubHeader/>
            {children}
            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
