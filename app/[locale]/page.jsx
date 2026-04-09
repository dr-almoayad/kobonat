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
import FeaturedStoresCarousel from '@/components/FeaturedStoresCarousel/FeaturedStoresCarousel';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import HeroCuratedSection from '@/components/HeroCuratedCarousel/HeroCuratedSection';
import HeroBestOfferCarousel from '@/components/HeroBestOfferCarousel/HeroBestOfferCarousel';

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
  const country = countryCode || 'SA';
  const currentWeek = getCurrentWeekIdentifier();
  const isArabic = language === 'ar';

  const [
    featuredStoresWithCovers,
    allActiveBrands,
    leaderboardSnapshots,
    rawTopStores,
  ] = await Promise.all([

    // 1. Hero stores (color slots 1–5)
    prisma.store.findMany({
      where: {
        isActive:   true,
        color:      { in: ['1', '2', '3', '4', '5'] },
        coverImage: { not: null },
        countries:  { some: { country: { code: country } } },
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

    // 2. Brands carousel
    prisma.store.findMany({
      where: {
        isActive:  true,
        countries: { some: { country: { code: country } } },
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

    // 4. Featured stores carousel — up to 27 stores (3 pages × 9)
    prisma.store.findMany({
      where: {
        isActive:  true,
        countries: { some: { country: { code: country } } },
      },
      select: {
        id:   true,
        logo: true,
        bigLogo: true,
        translations: {
          where:  { locale: language },
          select: { name: true, slug: true, showOffer: true },
        },
        vouchers: {
          where:   {
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
            discountPercent: { not: null },
          },
          orderBy: { discountPercent: 'desc' },
          take:    1,
          select:  { discountPercent: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 27,
    }),
  ]);

  // ── Transforms ─────────────────────────────────────────────────────────────

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

  const topStores = rawTopStores.map(s => {
    const translation = s.translations?.[0] || {};
    const topDiscount = s.vouchers?.[0]?.discountPercent;
    const discountText = translation.showOffer
      || (topDiscount
          ? (isArabic ? `خصم يصل إلى ${Math.round(topDiscount)}%` : `Up to ${Math.round(topDiscount)}% off`)
          : (isArabic ? 'عروض متاحة' : 'Deals available'));

    return {
      id:               s.id,
      name:             translation.name || '',
      slug:             translation.slug || '',
      logo:             s.logo,
      bigLogo:          s.bigLogo,
      ctaUrl:           null,
      discount:         discountText,
      previousDiscount: null,
      isPersonalized:   false,
    };
  });

const exclusiveVouchers = await prisma.voucher.findMany({
  where: {
    isExclusive: true,
    OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    countries: { some: { country: { code: country } } },
  },
  include: {
    translations: { where: { locale: lang } },
    store: { select: { logo: true, bigLogo: true, coverImage: true,
                       translations: { where: { locale: lang } } } },
  },
  orderBy: { popularityScore: 'desc' },
  take: 4,
});


  const carouselTitle = isArabic ? 'متاجر مميزة' : 'Featured Stores with Discounts';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="homepage-wrapper">

      {/* Hero */}
      <HeroCuratedSection locale={locale} countryCode={country} />

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

      {/* Curated Offers */}
      {/* <CuratedOffersSection locale={locale} countryCode={country} /> */}

      {/* Featured Stores Carousel */}
      {topStores.length > 0 && (
        <FeaturedStoresCarousel
          title={carouselTitle}
          locale={locale}
          stores={topStores}
        />
      )}

      <HeroBestOfferCarousel vouchers={exclusiveVouchers} locale={locale} />

      {/* Stackable Offers */}
      <OfferStacksSection locale={locale} countryCode={country} />

      {/* Blog */}
      <HomepageBlogSection locale={locale} count={3} />

      {/* Featured Products */}
      <HomeFeaturedProductsSection locale={locale} countryCode={country} />

      {/* Featured Vouchers */}
      <FeaturedVouchersSection locale={locale} countryCode={country} />

      {/* Featured Stores */}
      <FeaturedStoresSection locale={locale} />

      <HelpBox locale={locale} />
    </main>
  );
}
