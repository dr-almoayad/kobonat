// app/[locale]/layout.js - WITH ENHANCED SEO
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Font display swap for better performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// Default metadata (will be overridden by page-specific metadata)
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'),
  title: {
    default: 'Coupons & Deals - Save Money on Every Purchase',
    template: '%s | Coupons Platform'
  },
  description: 'Find the best coupons, promo codes, and deals from top stores. Save money on every purchase with verified discount codes.',
  applicationName: 'Coupons Platform',
  authors: [{ name: 'Coubonat' }],
  generator: 'Next.js',
  keywords: ['coupons', 'promo codes', 'deals', 'discounts', 'savings'],
  referrer: 'origin-when-cross-origin',
  creator: 'Coubonat',
  publisher: 'Coubonat',
  colorScheme: 'light',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: ['en_SA', 'ar_AE', 'en_AE', 'ar_EG', 'en_EG'],
    siteName: 'Coupons Platform',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    creator: '@yourhandle',
    site: '@yourhandle',
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  
  // Icons
  icons: {
    icon: '/coubonat-favicon.webp',
    shortcut: '/coubonat-favicon.png',
    apple: '/apple-touch-icon.png',
  },
  
  // Manifest
  manifest: '/site.webmanifest',
};

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

  return (
    <html 
      lang={locale} 
      dir={locale.startsWith('ar') ? 'rtl' : 'ltr'}
      style={{ colorScheme: 'light' }}
    >
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

        <meta name="OMG-Verify-V1" content="772676bb-a843-4bca-b05f-3fcf8aca9614"/>

        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
        
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
            <Header />
            <SubBar />
            {children}
            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
