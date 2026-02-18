import { Geist, Geist_Mono, Alexandria, Open_Sans } from "next/font/google";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import Header from "@/components/headers/Header";
import Footer from "@/components/footers/footer";
import SessionProviderWrapper from "@/components/SessionProviderComp";
import "@emran-alhaddad/saudi-riyal-font/index.css";
import MobileFooter from "@/components/footers/MobileFooter";
import CategoryCarouselSubHeader from "@/components/headers/CategoryCarouselSubHeader";
import Disclaimer from "@/components/Disclaimer/Disclaimer";
import WebSiteStructuredData from "@/components/StructuredData/WebSiteStructuredData";
import Script from 'next/script';

// Optimized Font Loading
const alexandria = Alexandria({ subsets: ["arabic"], variable: "--font-alexandria", display: 'swap' });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: 'swap' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: 'swap' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const GA_MEASUREMENT_ID = 'G-EFNHSXWE0M';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  const keywords = isArabic
    ? ['كوبونات', 'أكواد خصم', 'عروض', 'خصومات', 'توفير', 'السعودية', 'كود خصم تويتر', 'شحن مجاني', 'كوبونات المشاهير', 'خصم أول طلب', 'أكواد مجربة']
    : ['Coupons', 'Promo Codes', 'Saudi Deals', 'Discount Codes', 'Free Shipping', 'First Order Code', 'Verified Coupons', 'KSA Offers'];

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isArabic
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : 'Cobonat - Save More on Every Purchase',
      template: isArabic ? '%s | كوبونات' : '%s | Cobonat'
    },
    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    applicationName: isArabic ? 'كوبونات' : 'Cobonat',
    keywords: keywords,
    authors: [{ name: 'Cobonat' }],
    creator: 'Cobonat',
    publisher: 'Cobonat',
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      }
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: `${BASE_URL}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title: isArabic 
        ? "Cobonat | كوبونات - أكواد خصم السعودية" 
        : 'Cobonat - Save More on Every Purchase',
      description: isArabic 
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية." 
        : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons.",
      images: [{
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: isArabic ? 'كوبونات - أكواد خصم السعودية' : 'Cobonat - Saudi Coupons Platform'
      }]
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title: isArabic 
        ? "Cobonat | كوبونات - أكواد خصم السعودية" 
        : 'Cobonat - Save More on Every Purchase',
      description: isArabic 
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦" 
        : "Your #1 source for verified discount codes in Saudi 🇸🇦",
      images: [`${BASE_URL}/og-image.png`],
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
    manifest: isArabic ? '/manifest-ar.webmanifest' : '/manifest-en.webmanifest',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
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
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  return (
    <html lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#470ae2" />
        <meta name="msapplication-TileColor" content="#470ae2" />
        
        {/* Verification Tags */}
        <meta name="Takeads-verification" content="ac9f8039-eeff-43ac-8757-df8d658ef91b" />
        <meta name="tradetracker-site-verification" content="813f3ae64e317d77ca412f3741e5d24b3c977369" />
        <meta name="verify-admitad" content="95d170f413" />
        
        {/* Preconnects for Performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* Material Symbols - Dynamic Icon Font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
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
        
        {/* WebSite Structured Data */}
        <WebSiteStructuredData 
          locale={locale} 
          siteName={isArabic ? 'كوبونات' : 'Cobonat'}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} ${openSans.variable} antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProviderWrapper>
            <Header />
            <CategoryCarouselSubHeader />
            <main>
              {children}
              <Disclaimer locale={locale} />
            </main>
            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
                }
