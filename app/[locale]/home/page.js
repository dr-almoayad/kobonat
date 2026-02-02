// app/[locale]/page.js - UPDATED with BrandsCarousel
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
import AffiliatesHero from "@/components/affiliates/affiliatesHero";
import HelpBox from "@/components/help/HelpBox";

import { 
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateStoreListSchema,
  MultipleSchemas 
} from "@/lib/seo/structuredData";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://coubonat.vercel.app';

// ✅ FIXED: Generate metadata with proper canonical
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';
  
  return {
    title: isArabic 
      ? "Cobonat | كوبونات - أكواد خصم السعودية (محدث باستمرار) - وفر أكثر على مشترياتك ومقاضيك!"
      : "Cobonat | Active & Verified KSA Promo Codes 2026 - Verified Daily for Smart Savings!",
    description: isArabic
      ? "منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!"
      : "Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.",
    // ✅ CRITICAL: Include locale in canonical
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'ar-AE': `${BASE_URL}/ar-AE`,
        'en-AE': `${BASE_URL}/en-AE`,
        
        'x-default': `${BASE_URL}/ar-SA`,
      }
    },
    
    openGraph: {
      url: `${BASE_URL}/${locale}`,
      locale: locale,
      type: 'website',
    },
    
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Home({ params }) {
  const { locale } = await params;

  // FAIL-SAFE: If the locale is not in your allowed list, trigger 404 immediately.
  // This prevents Prisma from receiving "favicon.ico" as a locale.
  if (!allLocaleCodes.includes(locale)) {
    notFound();
  }

  const t = await getTranslations('HomePage');
  const [language, countryCode] = locale.split('-');

  // Fetch data with proper joins for translations
  const [featuredStoresWithCovers, topVouchers, featuredStores, allActiveBrands] = await Promise.all([
    // Featured stores WITH cover images
    prisma.store.findMany({
      where: { 
        isActive: true,
        isFeatured: true,
        coverImage: { not: null },
        // Ensure store is available in this country
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
    
    prisma.voucher.findMany({
      where: {
        expiryDate: { gte: new Date() },
        store: { isActive: true }
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            title: true,
            description: true,
          }
        },
        store: {
          include: {
            translations: {
              where: { locale: language },
              select: { 
                name: true, 
                slug: true 
              }
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
    
    prisma.store.findMany({
      where: { 
        isActive: true, 
        isFeatured: true 
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            name: true,
            slug: true,
          }
        },
        _count: {
          select: { 
            vouchers: { 
              where: { 
                expiryDate: { gte: new Date() } 
              } 
            } 
          }
        }
      },
      take: 16
    }),

    // NEW: Fetch brands for the carousel
    prisma.store.findMany({
      where: { 
        isActive: true,
        countries: {
          some: {
            country: { code: countryCode || 'SA' }
          }
        }
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            vouchers: {
              where: {
                expiryDate: { gte: new Date() },
                countries: {
                  some: {
                    country: {
                      code: countryCode || 'SA'
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { id: 'asc' }
      ],
      take: 20
    })
  ]);

  const transformStoreWithTranslation = (store) => {
    const translation = store.translations?.[0] || {};
    return {
      ...store,
      name: translation.name || store.slug || '',
      slug: translation.slug || '',
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
        name: storeTranslation.name || voucher.store.slug || '',
        slug: storeTranslation.slug || '',
        translations: undefined
      } : null,
      translations: undefined
    };
  };

  const transformedCarouselStores = featuredStoresWithCovers.map(transformStoreWithTranslation);
  const transformedFeaturedStores = featuredStores.map(transformStoreWithTranslation);
  const transformedTopVouchers = topVouchers.map(transformVoucherWithTranslation);

  // Transform brands for carousel
  const transformedBrands = allActiveBrands.map(brand => ({
    id: brand.id,
    name: brand.translations?.[0]?.name || '',
    slug: brand.translations?.[0]?.slug || '',
    logo: brand.logo,
    activeVouchersCount: brand._count?.vouchers || 0
  }));

  const schemas = [
    generateOrganizationSchema(locale),
    generateWebsiteSchema(locale),
    generateStoreListSchema(transformedFeaturedStores, locale)
  ];

  return (
    <>
      <MultipleSchemas schemas={schemas} />
      
      <main className="homepage-wrapper">
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

        {/* REPLACED: AffiliatesHero with BrandsCarousel */}
        {transformedBrands.length > 0 && (
          <BrandsCarousel brands={transformedBrands} />
        )}
        
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
