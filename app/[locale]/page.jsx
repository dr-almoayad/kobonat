// app/[locale]/page.jsx
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import "./page.css";
import { notFound } from "next/navigation";
import { allLocaleCodes } from "@/i18n/locales";
import BrandsCarousel from "@/components/BrandsCarousel/BrandsCarousel";
import CuratedOffersSection from '@/components/CuratedOffersSection/CuratedOffersSection';
import HomeFeaturedProductsSection from '@/components/HomeFeaturedProducts/HomeFeaturedProductsSection';
import HomepageBlogSection from '@/components/blog/HomepageBlogSection';
import HelpBox from "@/components/help/HelpBox";
import HomepageHeroSection from '@/components/HomepageHeroSection/HomepageHeroSection';
import OfferStacksSection from '@/components/OfferStacksSection/OfferStacksSection';
import FeaturedVouchersSection from '@/components/FeaturedVouchersSection/FeaturedVouchersSection';
import FeaturedStoresSection from '@/components/FeaturedStoresSection/FeaturedStoresSection';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import HeroCuratedSection from '@/components/HeroCuratedCarousel/HeroCuratedSection';


// ✅ PERF FIX: Removed `import WebSiteStructuredData` — it was being rendered
// both here (page level) AND in layout.jsx, injecting duplicate JSON-LD into
// every page response. The layout already handles structured data for all routes.

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  return {
    metadataBase: new URL(BASE_URL),
    title: isArabic
      ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
      : "Cobonat | Active & Verified KSA Promo Codes 2026 - Verified Daily for Smart Savings!",
    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      }
    },
    openGraph: {
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
      url: `${BASE_URL}/${locale}`,
      locale: locale,
      type: 'website',
      title: isArabic
        ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
        : "Cobonat | Active & Verified KSA Promo Codes 2026 - Verified Daily for Smart Savings!",
      description: isArabic
        ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
        : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function Home({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) notFound();

  const [language, countryCode] = locale.split('-');
  const currentWeek = getCurrentWeekIdentifier();

  // ── Data fetching — only what the hero section needs ──────────────────────
  // All other sections are self-fetching RSCs.
  const [
    featuredStoresWithCovers,
    allActiveBrands,
    leaderboardSnapshots,
  ] = await Promise.all([

    // 1. Hero stores
    prisma.store.findMany({
      where: {
        isActive:   true,
        color:      { in: ['1', '2', '3', '4', '5'] },
        coverImage: { not: null },
        countries:  { some: { country: { code: countryCode || 'SA' } } },
      },
      select: {
        id:         true,
        logo:       true,
        bigLogo:    true,
        coverImage: true,
        color:      true,
        translations: {
          where:  { locale: language },
          select: { name: true, slug: true, showOffer: true, seoTitle: true, description: true },
        },
      },
      orderBy: { color: 'asc' },
      take: 5,
    }),

    // 2. Brands Carousel
    prisma.store.findMany({
      where: {
        isActive:  true,
        countries: { some: { country: { code: countryCode || 'SA' } } },
      },
      include: {
        translations: {
          where:  { locale: language },
          select: { name: true, slug: true },
        },
        _count: {
          select: { vouchers: { where: { expiryDate: { gte: new Date() } } } },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 20,
    }),

    // 3. Leaderboard — global top 10 for current ISO week
    prisma.storeSavingsSnapshot.findMany({
      where:   { weekIdentifier: currentWeek, categoryId: null },
      orderBy: { rank: 'asc' },
      take:    10,
      select: {
        id: true, rank: true, previousRank: true, movement: true,
        calculatedMaxSavingsPercent: true, savingsOverridePercent: true,
        store: {
          select: {
            id: true, logo: true, bigLogo: true,
            translations: {
              where:  { locale: language },
              select: { name: true, slug: true },
            },
          },
        },
      },
    }),
  ]);

  const transformStore = (store) => {
    const t = store.translations?.[0] || {};
    return {
      ...store,
      name:        t.name        || '',
      slug:        t.slug        || '',
      showOffer:   t.showOffer   || '',
      seoTitle:    t.seoTitle    || '',
      description: t.description || '',
      translations: undefined,
    };
  };

  const transformedCarouselStores = featuredStoresWithCovers.map(transformStore);
  const transformedBrands = allActiveBrands.map(b => ({
    id:                  b.id,
    name:                b.translations?.[0]?.name || '',
    slug:                b.translations?.[0]?.slug || '',
    logo:                b.logo,
    activeVouchersCount: b._count?.vouchers || 0,
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="homepage-wrapper">

      {/* Hero */}
      <HeroCuratedSection locale={locale} countryCode={countryCode || 'SA'} />
      
      {/*{transformedCarouselStores.length > 0 && (
        <HomepageHeroSection
          stores={transformedCarouselStores}
          leaderboard={leaderboardSnapshots}
          locale={locale}
        />
      )}*/}

      {/* Brands Ticker */}
      {/*{transformedBrands.length > 0 && (
        <BrandsCarousel brands={transformedBrands} />
      )}*/}

      {/* Curated Offers 
      <CuratedOffersSection locale={locale} countryCode={countryCode || 'SA'} />*/}

      {/* Stackable Offers */}
      <OfferStacksSection locale={locale} countryCode={countryCode || 'SA'} />

      {/* Blog */}
      <HomepageBlogSection locale={locale} count={3} />

      {/* Featured Products */}
      <HomeFeaturedProductsSection locale={locale} countryCode={countryCode || 'SA'} />

      {/* Featured Vouchers */}
      <FeaturedVouchersSection locale={locale} countryCode={countryCode || 'SA'} />

      {/* Featured Stores */}
      <FeaturedStoresSection locale={locale} />

      <HelpBox locale={locale} />
    </main>
  );
}
