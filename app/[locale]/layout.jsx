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
import { prisma } from '@/lib/prisma'; // ✅ Direct Prisma access

// ── Fonts ───────────────────────────────────────────────────────────────
const alexandria = Alexandria({
  subsets: ["arabic"],
  variable: "--font-alexandria",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ── Constants ──────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cobonat.me";
const GA_MEASUREMENT_ID = "G-EFNHSXWE0M";

const MATERIAL_SYMBOLS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";

// ── Server‑side category fetch with ISR caching ──────────────────────
async function getCategories(locale) {
  try {
    const lang = locale.split('-')[0];

    // Fetch top 18 categories based on how many stores they have
    const categories = await prisma.category.findMany({
      // Removed the 'countryCode' where clause that was likely crashing Prisma
      include: {
        translations: {
          where: { locale: lang },
          select: { name: true, slug: true },
        },
        _count: {
          select: { stores: true },
        },
      },
      orderBy: {
        stores: { _count: 'desc' },
      },
      take: 18,
    });

    if (!categories || categories.length === 0) {
      console.warn('[Layout] Prisma returned 0 categories.');
      return [];
    }

    return categories.map((cat) => {
      const t = cat.translations[0] || {};
      return {
        id: cat.id,
        slug: t.slug || cat.slug || `category-${cat.id}`,
        name: t.name || cat.name || 'Category',
        image: cat.image,
        icon: cat.icon,
      };
    });
  } catch (error) {
    // This will now print the EXACT reason it's failing to your terminal
    console.error('[Layout] CRITICAL ERROR fetching categories:', error.message);
    return []; 
  }
}

// Helper to transform Prisma result to the shape expected by the component
function mapCategories(cats) {
  return cats.map((cat) => {
    const t = cat.translations[0] || {};
    return {
      id: cat.id,
      slug: t.slug || cat.slug || `category-${cat.id}`,
      name: t.name || cat.name || 'Category',
      image: cat.image,
      icon: cat.icon,
    };
  });
}

// ── Metadata ───────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split("-");
  const isArabic = language === "ar";

  const keywords = isArabic
    ? ["كوبونات", "أكواد خصم", "عروض", "خصومات", "توفير", "السعودية", "كود خصم", "شحن مجاني", "كوبونات مجربة"]
    : ["Coupons", "Promo Codes", "Saudi Deals", "Discount Codes", "Free Shipping", "Verified Coupons", "KSA Offers"];

  return {
    metadataBase: new URL(BASE_URL),
    applicationName: isArabic ? "كوبونات" : "Cobonat",

    title: {
      default: isArabic
        ? "كوبونات وأكواد خصم السعودية | Cobonat"
        : "Verified Saudi Arabia Coupons & Deals | Cobonat",
      template: isArabic ? "%s | كوبونات" : "%s | Cobonat",
    },

    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية."
      : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",

    keywords,
    authors: [{ name: "Cobonat" }],
    creator: "Cobonat",
    publisher: "Cobonat",

    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg" }],
    },

    manifest: isArabic ? "/manifest-ar.webmanifest" : "/manifest-en.webmanifest",

    openGraph: {
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}`,
      siteName: isArabic ? "كوبونات" : "Cobonat",
      title: isArabic
        ? "كوبونات وأكواد خصم السعودية | Cobonat"
        : "Verified Saudi Arabia Coupons & Deals | Cobonat",
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية."
        : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: "Cobonat Logo" }],
    },

    twitter: {
      card: "summary_large_image",
      site: "@cobonat",
      creator: "@cobonat",
      title: isArabic
        ? "كوبونات وأكواد خصم السعودية | Cobonat"
        : "Verified Saudi Arabia Coupons & Deals | Cobonat",
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية."
        : "Your #1 source for verified discount codes in Saudi Arabia. Active coupons for top local and global stores.",
      images: [`${BASE_URL}/logo-512x512.png`],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    other: {
      "msapplication-TileColor": "#470ae2",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#470ae2",
};

// ── Layout Component ──────────────────────────────────────────────────
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const [language, region] = locale.split("-");
  const isArabic = language === "ar";

  // ✅ Fetch categories server‑side (cached by Next.js)
  const categories = await getCategories(locale, region);

  // Dynamic Trustpilot locale
  const trustpilotLocale = isArabic ? "ar-AE" : "en-US";

  return (
    <html lang={locale} dir={isArabic ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Asynchronous Material Symbols loading */}
        <link rel="preload" href={MATERIAL_SYMBOLS_URL} as="style" />
        <link
          rel="stylesheet"
          href={MATERIAL_SYMBOLS_URL}
          media="print"
          onLoad="this.media='all'"
          crossOrigin="anonymous"
        />
        <noscript>
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} ${openSans.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProviderWrapper>
            <WebSiteStructuredData
              locale={locale}
              siteName={isArabic ? "كوبونات" : "Cobonat"}
            />

            <Header />

            {/*
              ✅ Pass pre‑fetched categories to the carousel.
              The component will render nothing if the array is empty.
            */}
            <CategoryCarouselSubHeader initialCategories={categories} />

            <main>{children}</main>

            <Disclaimer locale={locale} />

            <div
              className="trustpilot-widget"
              data-locale={trustpilotLocale}
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="6995d75245c20b813450e6e6"
              data-style-height="52px"
              data-style-width="100%"
              data-token="33c61b23-0f8b-4661-9277-0e2a157bf8ad"
              style={{ minHeight: "52px" }}
            >
              <a
                href="https://www.trustpilot.com/review/cobonat.me"
                target="_blank"
                rel="noopener nofollow"
              >
                Trustpilot
              </a>
            </div>

            <Footer />
            <MobileFooter />
          </SessionProviderWrapper>
        </NextIntlClientProvider>

        {/* Google Analytics */}
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

        {/* Trustpilot widget script */}
        <Script
          src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
