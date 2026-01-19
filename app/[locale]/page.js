// app/[locale]/page.js - FIXED LOCALE ISSUE
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import "./page.css";

// Components
import VoucherCard from "@/components/VoucherCard/VoucherCard";
import ProductFeedback from "@/components/feedback/productFeedback";
import StoreCard from "@/components/StoreCard/StoreCard";
import AffiliatesHero from "@/components/affiliates/affiliatesHero";

// SEO imports
import { generateHomeMetadata } from "@/lib/seo/metadata";
import { 
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateStoreListSchema,
  MultipleSchemas 
} from "@/lib/seo/structuredData";

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

  // ✅ FIX: Extract language code from full locale
  const [language, countryCode] = locale.split('-');
  // language will be 'ar' or 'en' - which matches your Locale enum

  // Fetch data with proper joins for translations
  const [affiliateStores, topVouchers, featuredStores] = await Promise.all([
    // Affiliate stores for hero - include translations
    prisma.store.findMany({
      where: { 
        isActive: true,
        logo: { not: null },
      },
      include: {
        translations: {
          where: { locale: language }, // ✅ Use 'ar' or 'en', not 'ar-SA'
          select: {
            name: true,
            slug: true,
          }
        },
        _count: { 
          select: { vouchers: true } 
        }
      },
      orderBy: { isFeatured: 'desc' },
      take: 30, 
    }),
    
    // Top vouchers - include store with translations
    prisma.voucher.findMany({
      where: {
        expiryDate: { gte: new Date() },
        store: { isActive: true }
      },
      include: {
        translations: {
          where: { locale: language }, // ✅ Use language only
          select: {
            title: true,
            description: true,
          }
        },
        store: {
          include: {
            translations: {
              where: { locale: language }, // ✅ Use language only
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
    
    // Featured stores - include translations
    prisma.store.findMany({
      where: { 
        isActive: true, 
        isFeatured: true 
      },
      include: {
        translations: {
          where: { locale: language }, // ✅ Use language only
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

  // Transform data to flatten translations
  const transformStoreWithTranslation = (store) => {
    const translation = store.translations?.[0] || {};
    return {
      ...store,
      name: translation.name || store.slug || '',
      slug: translation.slug || '',
      // Remove translations from final object to keep it clean
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

  const transformedAffiliateStores = affiliateStores.map(transformStoreWithTranslation);
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
        {/* Hero Section */}
        <div className="hero-section">
          <AffiliatesHero stores={transformedAffiliateStores} />
        </div>

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
            {t('viewAll', { defaultMessage: 'View All' })}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        </section>

        {/* Featured Stores Section */}
        <section className="home-section alt-bg">
          <div className="section-header">
            <div className="header-content">
              <h2>
                <span className="material-symbols-sharp">storefront</span>
                {t('featuredStoresTitle', { defaultMessage: 'Featured Stores' })}
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
            {t('browseStores', { defaultMessage: 'Browse Stores' })}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        </section>

        {/*<ProductFeedback />*/}
      </main>
    </>
  );
}