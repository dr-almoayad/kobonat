// app/[locale]/page.js
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import "./page.css";
import { notFound } from "next/navigation";
import { allLocaleCodes } from "@/i18n/locales";
import VoucherCard from "@/components/VoucherCard/VoucherCard";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import BrandsCarousel from "@/components/BrandsCarousel/BrandsCarousel";
import CuratedOffersSection from '@/components/CuratedOffersSection/CuratedOffersSection';
import HomeFeaturedProductsSection from '@/components/HomeFeaturedProducts/HomeFeaturedProductsSection';
import HomepageBlogSection from '@/components/blog/HomepageBlogSection';
import HelpBox from "@/components/help/HelpBox";
import WebSiteStructuredData from '@/components/StructuredData/WebSiteStructuredData';
import HomepageLeaderboardSection from '@/components/leaderboard/HomepageLeaderboardSection';

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
      images: [
        {
          url: `${BASE_URL}/logo-512x512.png`,
          width: 512,
          height: 512,
          alt: 'Cobonat Logo',
        }
      ],
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
  };
}

export default async function Home({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) {
    notFound();
  }

  const t = await getTranslations('HomePage');
  const [language, countryCode] = locale.split('-');

  // ── Data fetching ─────────────────────────────────────────────────────────
  // CuratedOffersSection is a Server Component that fetches its own data.
  // Do NOT fetch curatedOffers here — it would be a double database hit.
  const [featuredStoresWithCovers, topVouchers, featuredStores, allActiveBrands] = await Promise.all([

    // 1. Hero Carousel Stores
    prisma.store.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        coverImage: { not: null },
        countries: { some: { country: { code: countryCode || 'SA' } } }
      },
      include: {
        translations: {
          where: { locale: language },
          select: { name: true, slug: true }
        },
      },
      orderBy: { isFeatured: 'desc' },
      take: 10,
    }),

    // 2. Top Vouchers
    prisma.voucher.findMany({
      where: {
        expiryDate: { gte: new Date() },
        store: { isActive: true },
        countries: { some: { country: { code: countryCode || 'SA' } } }
      },
      include: {
        translations: {
          where: { locale: language },
          select: { title: true, description: true }
        },
        store: {
          include: {
            translations: {
              where: { locale: language },
              select: { name: true, slug: true }
            }
          }
        }
      },
      orderBy: [
        { isExclusive: 'desc' },
        { popularityScore: 'desc' }
      ],
      take: 21
    }),

    // 3. Featured Stores List
    prisma.store.findMany({
      where: {
        isActive: true,
        isFeatured: true
      },
      include: {
        translations: {
          where: { locale: language },
          select: { name: true, slug: true, showOffer: true }
        },
        _count: {
          select: {
            vouchers: {
              where: { expiryDate: { gte: new Date() } }
            }
          }
        }
      },
      take: 16
    }),

    // 4. Brands Carousel
    prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: countryCode || 'SA' } } }
      },
      include: {
        translations: {
          where: { locale: language },
          select: { name: true, slug: true }
        },
        _count: {
          select: {
            vouchers: {
              where: { expiryDate: { gte: new Date() } }
            }
          }
        }
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 20
    }),
  ]);

  // ── Data transformations ──────────────────────────────────────────────────

  const transformStoreWithTranslation = (store) => {
    const translation = store.translations?.[0] || {};
    return {
      ...store,
      name: translation.name || '',
      slug: translation.slug || '',
      showOffer: translation.showOffer || '',
      translations: undefined
    };
  };

  const transformVoucherWithTranslation = (voucher) => {
    const voucherTranslation = voucher.translations?.[0] || {};
    const storeTranslation = voucher.store?.translations?.[0] || {};
    return {
      ...voucher,
      title: voucherTranslation.title || 'Special Offer',
      description: voucherTranslation.description || null,
      store: voucher.store ? {
        ...voucher.store,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        translations: undefined
      } : null,
      translations: undefined
    };
  };

  const transformedCarouselStores = featuredStoresWithCovers.map(transformStoreWithTranslation);
  const transformedFeaturedStores  = featuredStores.map(transformStoreWithTranslation);
  const transformedTopVouchers     = topVouchers.map(transformVoucherWithTranslation);

  const transformedBrands = allActiveBrands.map(brand => ({
    id: brand.id,
    name: brand.translations?.[0]?.name || '',
    slug: brand.translations?.[0]?.slug || '',
    logo: brand.logo,
    activeVouchersCount: brand._count?.vouchers || 0
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <WebSiteStructuredData locale={locale} />

      <main className="homepage-wrapper">

        {/* Hero Section */}
        {transformedCarouselStores.length > 0 && (
          <div className="hero-section">
            <HeroCarousel
              images={transformedCarouselStores.map(store => ({
                id: store.id,
                image: store.coverImage,
                name: store.name,
                logo: store.logo,
              }))}
              locale={locale}
              height="400px"
              autoplayDelay={4000}
              showOverlay={true}
            />
          </div>
        )}

        {/* Brands Ticker */}
        {transformedBrands.length > 0 && (
          <BrandsCarousel brands={transformedBrands} />
        )}

        {/* Curated Offers — self-contained Server Component, fetches its own data */}
        <CuratedOffersSection
          locale={locale}
          countryCode={countryCode || 'SA'}
        />
        
        {/* Savings Leaderboard — top 5 stores by verified discount this week */}
        <HomepageLeaderboardSection locale={locale} />

        {/* Blog Section — latest/featured articles, returns null if no published posts */}
        <HomepageBlogSection locale={locale} count={3} />

        {/* Featured Products — hand-picked products from multiple stores */}
        <HomeFeaturedProductsSection
          locale={locale}
          countryCode={countryCode || 'SA'}
        />


        {/* Top Deals Grid */}
        <section className="home-section">
          <div className="section-header">
            <div className="header-content">
              <h2>
                <span className="material-symbols-sharp">local_fire_department</span>
                {t('topDealsTitle', { defaultMessage: 'Trending Deals' })}
              </h2>
              <p>{t('topDealsSubtitle', { defaultMessage: 'Verified codes saving you money today' })}</p>
            </div>
          </div>

          <div className="vouchers-grid-home">
            {transformedTopVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
              />
            ))}
          </div>

          <Link href={`/${locale}/stores`} className="btn-view-all">
            {t('viewAll', { defaultValue: 'View All' })}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        </section>

        {/* Featured Stores Grid */}
        <section className="home-section alt-bg">
          <div className="section-header">
            <div className="header-content">
              <h2>
                <span className="material-symbols-sharp">storefront</span>
                {t('featuredStoresTitle', { defaultValue: 'Featured Stores' })}
              </h2>
            </div>
          </div>

          <div className="stores-grid-home">
            {transformedFeaturedStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
              />
            ))}
          </div>

          <Link href={`/${locale}/stores`} className="btn-view-all">
            {t('browseStores', { defaultValue: 'Browse Stores' })}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        </section>

      </main>

      <HelpBox locale={locale} />
    </>
  );
}
