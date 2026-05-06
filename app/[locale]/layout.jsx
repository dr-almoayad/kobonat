// app/[locale]/layout.jsx

import { Geist, Geist_Mono, Alexandria, Open_Sans } from "next/font/google";
import "./globals.css";
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

const alexandria = Alexandria({ subsets: ["arabic"], variable: "--font-alexandria", display: 'swap' });
const openSans   = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: 'swap' });
const geistSans  = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: 'swap' });
const geistMono  = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: 'swap' });

const BASE_URL           = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const GA_MEASUREMENT_ID  = 'G-EFNHSXWE0M';

const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language]  = locale.split('-');
  const isArabic    = language === 'ar';

  const keywords = isArabic
    ? ['كوبونات', 'أكواد خصم', 'عروض', 'خصومات', 'توفير', 'السعودية', 'كود خصم', 'شحن مجاني', 'كوبونات مجربة']
    : ['Coupons', 'Promo Codes', 'Saudi Deals', 'Discount Codes', 'Free Shipping', 'Verified Coupons', 'KSA Offers'];

  return {
    metadataBase:    new URL(BASE_URL),
    applicationName: isArabic ? 'كوبونات' : 'Cobonat',

    title: {
      default:  isArabic
        ? 'كوبونات وأكواد خصم السعودية | Cobonat'
        : 'Verified Saudi Arabia Coupons & Deals | Cobonat',
      template: isArabic ? '%s | كوبونات' : '%s | Cobonat',
    },

    description: isArabic
      ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية.'
      : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",

    keywords,
    authors:   [{ name: 'Cobonat' }],
    creator:   'Cobonat',
    publisher: 'Cobonat',

    icons: {
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
      other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg' }],
    },

    manifest: isArabic ? '/manifest-ar.webmanifest' : '/manifest-en.webmanifest',

    // ✅ FIX: Removed the `alternates` block that was present here.
    //
    // Previously this layout emitted:
    //   alternates: { canonical: `${BASE_URL}/${locale}` }
    //
    // Because Next.js shallow-merges layout metadata with page metadata,
    // that layout-level canonical was overriding the correct per-page
    // canonical set in every store, category, blog, and coupons page —
    // effectively telling Google that every page on the site canonicalizes
    // to the homepage. Each page now owns its own canonical declaration.

    openGraph: {
      type:     'website',
      locale,
      url:      `${BASE_URL}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title:    isArabic
        ? 'كوبونات وأكواد خصم السعودية | Cobonat'
        : 'Verified Saudi Arabia Coupons & Deals | Cobonat',
      description: isArabic
        ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية.'
        : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
    },

    twitter: {
      card:    'summary_large_image',
      site:    '@cobonat',
      creator: '@cobonat',
      title:   isArabic
        ? 'كوبونات وأكواد خصم السعودية | Cobonat'
        : 'Verified Saudi Arabia Coupons & Deals | Cobonat',
      description: isArabic
        ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية.'
        : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",
      images: [`${BASE_URL}/logo-512x512.png`],
    },

    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-video-preview':  -1,
        'max-image-preview':  'large',
        'max-snippet':        -1,
      },
    },

    other: {
      'msapplication-TileColor':    '#470ae2',
      'Takeads-verification':       'ac9f8039-eeff-43ac-8757-df8d658ef91b',
      'tradetracker-site-verification': '813f3ae64e317d77ca412f3741e5d24b3c977369',
      'verify-admitad':             '95d170f413',
    },
  };
}

export const viewport = {
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
  themeColor:    '#470ae2',
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages  = await getMessages();
  const [language] = locale.split('-');
  const isArabic   = language === 'ar';

  return (
    <html lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href={MATERIAL_SYMBOLS_URL}
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} ${openSans.variable} antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProviderWrapper>
            <WebSiteStructuredData
              locale={locale}
              siteName={isArabic ? 'كوبونات' : 'Cobonat'}
            />
            <Header />
            <CategoryCarouselSubHeader />
            <main>
              {children}
              <Disclaimer locale={locale} />
              <div
                className="trustpilot-widget"
                data-locale="en-US"
                data-template-id="56278e9abfbbba0bdcd568bc"
                data-businessunit-id="6995d75245c20b813450e6e6"
                data-style-height="52px"
                data-style-width="100%"
                data-token="33c61b23-0f8b-4661-9277-0e2a157bf8ad"
                style={{ minHeight: '52px' }}
              >
                <a href="https://www.trustpilot.com/review/cobonat.me" target="_blank" rel="noopener">
                  Trustpilot
                </a>
              </div>
            </main>
            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>

        <Script id="material-symbols-activate" strategy="afterInteractive">
          {`
            (function () {
              var preload = document.querySelector('link[rel="preload"][href*="Material+Symbols"]');
              if (preload) {
                preload.rel = 'stylesheet';
              } else {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '${MATERIAL_SYMBOLS_URL}';
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
              }
            })();
          `}
        </Script>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
