// app/[locale]/layout.jsx
//
// ✅ FIX SUMMARY:
// 1. This is now the ONLY layout that renders <html> and <body>.
//    app/layout.jsx has been reduced to `return children` to prevent
//    the duplicate <head>/<body> structure that was breaking SEO.
//
// 2. The explicit <head>...</head> block has been removed.
//    All meta tags that were inside it have been moved into
//    generateMetadata() using the `other` and `verification` keys.
//    Next.js will hoist these into the real <head> automatically.
//
// 3. <WebSiteStructuredData> moved from <head> into <body>.
//    JSON-LD scripts are valid anywhere in the document and do not
//    need to live inside <head>.
//
// ✅ PERF FIX (2025-03-05):
// 4. Material Symbols stylesheet removed from <head> (was render-blocking,
//    chained to a 3,352 KiB woff2 on the critical path).
//    It is now loaded via Script strategy="afterInteractive" so it never
//    blocks FCP/LCP.  Icons will use font-display:swap from the URL so
//    they appear as soon as the font arrives without any invisible flash.
//
// 5. fonts.gstatic.com preconnect now carries crossOrigin="anonymous"
//    (required for the CORS font fetch — without it the preconnect was a no-op).
//
// 6. Trustpilot widget div now has an explicit minHeight so the 52px
//    widget slot is reserved in the layout before the JS widget loads,
//    eliminating the CLS contribution from that element.

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

const alexandria = Alexandria({ subsets: ["arabic"], variable: "--font-alexandria", display: 'swap' });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: 'swap' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: 'swap' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const GA_MEASUREMENT_ID = 'G-EFNHSXWE0M';

// ── Shared Material Symbols URL ───────────────────────────────────────────────
// Defined once here so the <link preload> in <head> and the async Script
// in <body> both reference exactly the same URL (cache hit guaranteed).
const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  const keywords = isArabic
    ? ['كوبونات', 'أكواد خصم', 'عروض', 'خصومات', 'توفير', 'السعودية', 'كود خصم تويتر', 'شحن مجاني', 'كوبونات المشاهير', 'خصم أول طلب', 'أكواد مجربة']
    : ['Coupons', 'Promo Codes', 'Saudi Deals', 'Discount Codes', 'Free Shipping', 'First Order Code', 'Verified Coupons', 'KSA Offers'];

  return {
    metadataBase: new URL(BASE_URL),
    applicationName: isArabic ? 'كوبونات' : 'Cobonat',
    title: {
      default: isArabic
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : 'Cobonat - Save More on Every Purchase',
      template: isArabic ? '%s | كوبونات' : '%s | Cobonat',
    },
    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    keywords,
    authors: [{ name: 'Cobonat' }],
    creator: 'Cobonat',
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
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      url: `${BASE_URL}/${locale}`,
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title: isArabic
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : "Cobonat | Active & Verified KSA Promo Codes 2026 - Verified Daily for Smart Savings!",
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
        : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title: isArabic
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : "Cobonat | Active & Verified KSA Promo Codes 2026 - Verified Daily for Smart Savings!",
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
        : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
      images: [`${BASE_URL}/logo-512x512.png`],
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
    // ✅ FIX: Verification tags and msapplication meta moved from the
    // explicit <head> block into metadata. Next.js renders these as
    // proper <meta> tags inside the real <head> automatically.
    other: {
      'msapplication-TileColor': '#470ae2',
      'Takeads-verification': 'ac9f8039-eeff-43ac-8757-df8d658ef91b',
      'tradetracker-site-verification': '813f3ae64e317d77ca412f3741e5d24b3c977369',
      'verify-admitad': '95d170f413',
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
    // ✅ This <html> and <body> are the ONLY ones in the document now.
    // No duplicate shell from app/layout.jsx anymore.
    <html lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
      <head>
        {/*
          ✅ Preconnect to Google Fonts origins so the browser opens the
          TCP/TLS tunnels as early as possible.
          IMPORTANT: fonts.gstatic.com MUST have crossOrigin="anonymous"
          because font files are fetched with CORS — without it the browser
          opens an anonymous connection anyway, so the preconnect is wasted.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          ✅ PERF FIX: Preload the Material Symbols CSS as a high-priority
          hint WITHOUT it blocking render.  rel="preload" tells the browser
          to fetch the resource in parallel with the rest of the page but
          not to apply it until we explicitly switch rel to "stylesheet"
          (done in the Script below once the page is interactive).
        */}
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
            {/*
              ✅ FIX: WebSiteStructuredData moved from <head> into <body>.
              JSON-LD <script> tags are valid anywhere in the document.
              Google recommends <head> but accepts <body> too.
            */}
            <WebSiteStructuredData
              locale={locale}
              siteName={isArabic ? 'كوبونات' : 'Cobonat'}
            />
            <Header />
            <CategoryCarouselSubHeader />
            <main>
              {children}
              <Disclaimer locale={locale} />

              {/*
                ✅ CLS FIX: Added explicit minHeight matching data-style-height.
                Without this the widget slot has 0 height until the Trustpilot
                bootstrap JS runs, causing a layout shift every page load.
                The height is the same value already declared in data-style-height.
              */}
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

        {/*
          ✅ PERF FIX: Material Symbols is now activated here instead of
          being a blocking <link rel="stylesheet"> in <head>.
          strategy="afterInteractive" means this runs after hydration —
          the preload hint above has already fetched the CSS by then,
          so activation is near-instant with zero network wait.
          The &display=swap in the URL ensures icon glyphs swap in as
          soon as the font is ready rather than staying invisible.
        */}
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
