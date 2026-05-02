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
import HeroBestOffersCarousel from '@/components/HeroBestOffersCarousel/HeroBestOffersCarousel';
import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import SavingsBanner from '@/components/SavingsBanner/SavingsBanner';
import HowItWorks from '@/components/HowItWorks/HowItWorks';

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale }  = await params;
  const [language]  = locale.split('-');
  const isArabic    = language === 'ar';

  // ✅ FIX: Titles kept under 60 characters so Google displays them intact.
  //    The previous Arabic title was ~90 chars and was consistently rewritten
  //    in SERPs, removing the primary keyword "أكواد خصم السعودية".
  const title = isArabic
    ? 'كوبونات وأكواد خصم السعودية الموثقة | Cobonat'
    : 'Verified Saudi Arabia Coupon Codes & Deals | Cobonat';

  const description = isArabic
    ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية — مقاضيك، لبسك، وسفرياتك صارت أوفر!'
    : "Your #1 source for verified discount codes in Saudi 🇸🇦. Active coupons for top local and global stores — fashion, electronics, groceries and more.";

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA`,
        'en-SA':    `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      },
    },
    openGraph: {
      siteName:    isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
      url:    `${BASE_URL}/${locale}`,
      locale,
      type:   'website',
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      creator:     '@cobonat',
      title,
      description,
      images:      [`${BASE_URL}/logo-512x512.png`],
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  };
}

export default async function Home({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) notFound();

  const [language, countryCode] = locale.split('-');
  const country      = countryCode || 'SA';
  const currentWeek  = getCurrentWeekIdentifier();
  const isArabic     = language === 'ar';

  // ── Primary keyword phrase for the server-rendered H1 ──────────────────
  // This string must match (or closely mirror) the <title> tag above so Google
  // treats the page as highly relevant for the Arabic query cluster.
  const pageH1 = isArabic
    ? 'كوبونات وأكواد خصم السعودية الموثقة'
    : 'Verified Saudi Arabia Coupon Codes & Deals';

  // ── Sub-heading beneath H1 — adds semantic context without bloating the H1 ──
  const pageSubtitle = isArabic
    ? 'وفر أكثر مع كوبونات فعالة ومجربة من أشهر المتاجر العالمية والمحلية'
    : 'Save more with verified, tested coupons from top local and international stores';

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
        id:      true,
        logo:    true,
        bigLogo: true,
        translations: {
          where:  { locale: language },
          select: { name: true, slug: true, showOffer: true },
        },
        vouchers: {
          where: {
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
      translations: { where: { locale: language } },
      store: { select: { logo: true, bigLogo: true, coverImage: true,
                         translations: { where: { locale: language } } } },
    },
    orderBy: { popularityScore: 'desc' },
    take: 4,
  });

  const carouselTitle = isArabic ? 'متاجر مميزة' : 'Featured Stores with Discounts';

  // ── Structured data: ItemList for homepage featured stores ──────────────
  // Gives Google Arabic semantic anchors without relying on client-rendered JS.
  const homepageSchema = topStores.length > 0 ? {
    '@context':    'https://schema.org',
    '@type':       'ItemList',
    name:          pageH1,
    description:   pageSubtitle,
    numberOfItems: topStores.length,
    itemListElement: topStores.map((s, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      name:      s.name,
      url:       `${BASE_URL}/${locale}/stores/${s.slug}`,
    })),
  } : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {homepageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
        />
      )}

      <main className="homepage-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>

        {/*
          ✅ FIX: Server-rendered H1 — always present in the HTML that
          Googlebot indexes, regardless of whether client components hydrate.
          Styled to visually match the hero section but guaranteed to be in
          the initial HTML response.

          The H1 uses the same keyword string as the <title> tag so Google
          consistently identifies this page as the authority for
          "كوبونات السعودية" and related Arabic query clusters.
        */}
        <div className="homepage-hero-heading" aria-label="page heading">
          <h1 className="homepage-h1">{pageH1}</h1>
          <p className="homepage-h1-sub">{pageSubtitle}</p>
        </div>

        {/* Hero */}
        <HeroCuratedSection locale={locale} countryCode={country} />
        <SavingsBanner locale={locale} />
        <HeroBestOffersCarousel />

        {/* Featured Stores */}
        <FeaturedStoresSection locale={locale} />

        {/* Stackable Offers */}
        <OfferStacksSection locale={locale} countryCode={country} />

        {/* Featured Products */}
        <HomeFeaturedProductsSection locale={locale} countryCode={country} />

        <HowItWorks locale={locale} />

        {/* Blog */}
        <HomepageBlogSection locale={locale} count={3} />

        <PromoCodesFAQ />

        <HelpBox locale={locale} />
      </main>
    </>
  );
}
