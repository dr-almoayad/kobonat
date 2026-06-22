// app/[locale]/page.jsx
// FULLY CORRECTED – includes lastModified and full metadata.
// Note: The 403 and Prisma errors are not in this file; see guidance above.

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

export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale }  = await params;
  const [language]  = locale.split('-');
  const isArabic    = language === 'ar';

  const title = isArabic
    ? 'كوبونات وأكواد خصم السعودية | Cobonat'
    : 'Verified Saudi Arabia Coupon Codes & Deals | Cobonat';

  const description = isArabic
    ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية — مقاضيك، لبسك، وسفرياتك صارت أوفر!'
    : "Your #1 source for verified discount codes in Saudi 🇸🇦. Active coupons for top local and global stores — fashion, electronics, groceries and more.";

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    lastModified: new Date().toISOString(),
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

  const pageH1 = isArabic
    ? 'كوبونات وأكواد خصم السعودية'
    : 'Verified Saudi Arabia Coupon Codes & Deals';

  const pageSubtitle = isArabic
    ? 'وفر أكثر مع كوبونات فعالة ومجربة من أشهر المتاجر العالمية والمحلية'
    : 'Save more with verified, tested coupons from top local and international stores';

  const [
    featuredStoresWithCovers,
    allActiveBrands,
    leaderboardSnapshots,
    rawTopStores,
  ] = await Promise.all([
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
        _count: {
          select: {
            vouchers: {
              where: {
                OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 27,
    }),
  ]);

  const topStores = rawTopStores.map(store => {
    const translation = store.translations?.[0] || {};
    const topDiscount = store.vouchers?.[0]?.discountPercent;
    const discountText = translation.showOffer
      || (topDiscount
          ? (isArabic ? `خصم يصل إلى ${Math.round(topDiscount)}%` : `Up to ${Math.round(topDiscount)}% off`)
          : (isArabic ? 'عروض متاحة' : 'Deals available'));

    return {
      id: store.id,
      name: translation.name || '',
      slug: translation.slug || '',
      logo: store.logo,
      bigLogo: store.bigLogo,
      discount: discountText,
      showOffer: discountText,
      showOfferType: 'OFFER',
      translations: [{
        locale: language,
        name: translation.name || '',
        slug: translation.slug || '',
        showOffer: discountText,
      }],
      _count: store._count,
      vouchers: store.vouchers,
    };
  });

  const carouselTitle = isArabic ? 'متاجر مميزة' : 'Featured Stores with Discounts';

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

  return (
    <>
      {homepageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
        />
      )}

      <main className="homepage-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="homepage-hero-heading" aria-label="page heading">
          <h1 className="homepage-h1">{pageH1}</h1>
          <p className="homepage-h1-sub">{pageSubtitle}</p>
        </div>

        <HeroCuratedSection locale={locale} countryCode={country} />
        <SavingsBanner locale={locale} />
        <HeroBestOffersCarousel />

        <FeaturedStoresCarousel
          title={carouselTitle}
          stores={topStores}
          locale={locale}
        />

        <OfferStacksSection locale={locale} countryCode={country} />
        <HomeFeaturedProductsSection locale={locale} countryCode={country} />
        <HowItWorks locale={locale} />
        <HomepageBlogSection locale={locale} count={3} />
        <PromoCodesFAQ />
        <HelpBox locale={locale} />
      </main>
    </>
  );
}
