// app/[locale]/page.js - FIXED: Removed invalid 'slug' selection from Store model
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
import FeaturedOffersCarousel from "@/components/FeaturedOffersCarousel/FeaturedOffersCarousel";
import HelpBox from "@/components/help/HelpBox";

import WebSiteStructuredData from '@/components/StructuredData/WebSiteStructuredData';

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');
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

  // Fetch data
  const [featuredStoresWithCovers, topVouchers, featuredStores, allActiveBrands, curatedOffers] = await Promise.all([
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
      orderBy: [ { isFeatured: 'desc' }, { id: 'asc' } ],
      take: 20
    }),

    // 5. Curated Offers (FIXED)
    prisma.curatedOffer.findMany({
      where: {
        isActive: true,
        OR: [
          { expiryDate: { gte: new Date() } },
          { expiryDate: null }
        ],
        countries: {
          some: { country: { code: countryCode || 'SA' } }
        }
      },
      include: {
        store: {
          select: {
            id: true,
            logo: true,
            // REMOVED `slug: true` here because it doesn't exist on Store model
            translations: {
              where: { locale: language },
              select: { name: true, slug: true }
            }
          }
        },
        translations: {
          where: { locale: language },
          select: { title: true, description: true, ctaText: true }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { order: 'asc' }
      ],
      take: 10
    })
  ]);

  // --- Data Transformation Helpers ---

  const transformStoreWithTranslation = (store) => {
    const translation = store.translations?.[0] || {};
    return {
      ...store,
      name: translation.name || store.slug || '', // Fallback safely if slug existed (it doesn't on root, but safe to access undefined)
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

  const transformCuratedOffer = (offer) => {
    const translation = offer.translations?.[0] || {};
    const storeTranslation = offer.store?.translations?.[0] || {};
    
    return {
      ...offer,
      title: translation.title || '',
      description: translation.description || '',
      ctaText: translation.ctaText || '',
      store: offer.store ? {
        ...offer.store,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        translations: undefined
      } : null,
      translations: undefined
    };
  };

  const transformedCarouselStores = featuredStoresWithCovers.map(transformStoreWithTranslation);
  const transformedFeaturedStores = featuredStores.map(transformStoreWithTranslation);
  const transformedTopVouchers = topVouchers.map(transformVoucherWithTranslation);
  const transformedCuratedOffers = curatedOffers.map(transformCuratedOffer);

  const transformedBrands = allActiveBrands.map(brand => ({
    id: brand.id,
    name: brand.translations?.[0]?.name || '',
    slug: brand.translations?.[0]?.slug || '',
    logo: brand.logo,
    activeVouchersCount: brand._count?.vouchers || 0
  }));

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
        
        {/* Featured/Curated Offers Carousel */}
        {transformedCuratedOffers.length > 0 && (
          <FeaturedOffersCarousel 
            title={t('featuredOffersTitle', { defaultMessage: 'Exclusive Offers' })}
            offers={transformedCuratedOffers}
            locale={locale}
          />
        )}
        
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
      <HelpBox locale={locale}/>
    </>
  );
}
