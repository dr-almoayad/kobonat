// app/[locale]/page.js - WITH HERO CAROUSEL
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import "./page.css";

// Components
import VoucherCard from "@/components/VoucherCard/VoucherCard";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";

// SEO imports
import { generateHomeMetadata } from "@/lib/seo/metadata";
import { 
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateStoreListSchema,
  MultipleSchemas 
} from "@/lib/seo/structuredData";
import AffiliatesHero from "@/components/affiliates/affiliatesHero";

export const revalidate = 60;

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const countryCode = locale.split('-')[1] || 'SA';
  
  try {
    const country = await prisma.country.findUnique({
      where: { code: countryCode }
    });
    
    if (!country) return {};
    
    return generateHomeMetadata(locale, country);
  } catch (error) {
    return {};
  }
}

export default async function Home({ params }) {
  const { locale } = await params;
  const t = await getTranslations('HomePage');

  const [language, countryCode] = locale.split('-');

  // Fetch data with proper joins for translations
  const [featuredStoresWithCovers, topVouchers, featuredStores] = await Promise.all([
    // Featured stores WITH cover images for carousel
    prisma.store.findMany({
      where: { 
        isActive: true,
        isFeatured: true,
        coverImage: { not: null }, // Only stores with cover images
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            name: true,
            slug: true,
          }
        },
      },
      orderBy: { isFeatured: 'desc' },
      take: 10, // Limit carousel slides
    }),
    
    // Top vouchers
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
    
    // Featured stores
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
    })
  ]);

  // Transform data
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

  // Generate structured data
  const schemas = [
    generateOrganizationSchema(locale),
    generateWebsiteSchema(locale),
    generateStoreListSchema(transformedFeaturedStores, locale)
  ];

  return (
    <>
      {/* Structured Data */}
      <MultipleSchemas schemas={schemas} />
      
      <main className="homepage-wrapper">
        
        {/* Hero Carousel Section */}
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
            />
          </div>
        )}

        <AffiliatesHero/>
        
        {/* Top Vouchers Section */}
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

        {/* Featured Stores Section */}
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
    </>
  );
}
