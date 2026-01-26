// app/[locale]/stores/page.jsx - FIXED SEO
import { getTranslations } from 'next-intl/server';
import { prisma } from "@/lib/prisma";
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import { getCountryCategories } from "@/lib/storeCategories";
import { getStoresData } from "@/lib/stores";
import { isValidLocale } from "@/i18n/locales"; // Import your validator
import { notFound } from "next/navigation";
import "./stores-page.css";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://coubonat.vercel.app';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  // Guard for Metadata
  const [lang, region] = locale.split('-');
  if (!isValidLocale(lang, region)) return {};

  const isArabic = lang === 'ar';
  
  return {
    title: isArabic 
      ? `جميع المتاجر - كوبونات وعروض ${region}`
      : `All Stores - Coupons & Deals ${region}`,
    description: isArabic
      ? `تصفح جميع المتاجر المتاحة في ${region}. احصل على أفضل الكوبونات والعروض من متاجرك المفضلة.`
      : `Browse all available stores in ${region}. Get the best coupons and deals from your favorite stores.`,
    
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/stores`,
        'en-SA': `${BASE_URL}/en-SA/stores`,
        'ar-AE': `${BASE_URL}/ar-AE/stores`,
        'en-AE': `${BASE_URL}/en-AE/stores`,
        'x-default': `${BASE_URL}/ar-SA/stores`,
      }
    },
    openGraph: {
      url: `${BASE_URL}/${locale}/stores`,
      locale: locale,
    },
  };
}

export default async function AllStoresPage({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');

  // 1. CRITICAL: Locale Guard (Prevents Prisma/build crashes)
  if (!isValidLocale(language, countryCode)) {
    notFound();
  }

  const t = await getTranslations('StoresPage');

  // 2. FIXED: Added country filter to the Prisma query
  const featuredStoresWithCovers = await prisma.store.findMany({
    where: { 
      isActive: true,
      isFeatured: true,
      coverImage: { not: null },
      // Filter by the current country segment
      countries: { some: { country: { code: countryCode } } } 
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
    take: 8,
  });

  const carouselStores = featuredStoresWithCovers.map(store => {
    const translation = store.translations?.[0] || {};
    return {
      id: store.id,
      image: store.coverImage,
      name: translation.name || store.slug || '',
      logo: store.logo,
    };
  });

  // These helpers should already handle filtering based on the args you pass
  const stores = await getStoresData({ 
    language, 
    countryCode 
  });

  const categories = await getCountryCategories(language, countryCode);
  const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
  const featuredStores = stores.filter(s => s.isFeatured);
  const regularStores = stores.filter(s => !s.isFeatured);

  if (stores.length === 0) {
    return (
      <div className="stores_page">
        <div className="stores_page_header">
          <div className="stores_page_header_container">
            <div className="error-container">
              <span className="material-symbols-sharp" style={{fontSize: '48px', color: '#cbd5e1', marginBottom: '1rem'}}>
                store_off
              </span>
              <h1>{language === 'ar' ? 'لا توجد متاجر متاحة' : 'No Stores Available'}</h1>
              <p>
                {language === 'ar' 
                  ? 'لا توجد متاجر متاحة حالياً في منطقتك.'
                  : 'No stores available at the moment in your region.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stores_page">
      {carouselStores.length > 0 && (
        <div className="stores-hero-section">
          <HeroCarousel 
            images={carouselStores}
            locale={locale}
            height="350px"
            autoplayDelay={3500}
          />
        </div>
      )}

      <div className="stores_page_header">
        <div className="stores_page_header_container">
          <div className="stores_page_title_section">
            <div className="stores_page_icon">
              <span className="material-symbols-sharp">storefront</span>
            </div>
            <div className="stores_info">
              <h1>{t('pageTitle')}</h1>
              <p className="stores_stats">
                <span className="stat_item">
                  <span className="material-symbols-sharp">store</span>
                  <strong>{stores.length}</strong>
                  {t('storesCount', { count: stores.length })}
                </span>
                <span className="stat_separator">•</span>
                <span className="stat_item">
                  <span className="material-symbols-sharp">local_offer</span>
                  <strong>{totalVouchers}</strong>
                  {t('vouchersCount', { count: totalVouchers })}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {featuredStores.length > 0 && (
        <section className="featured_stores_section">
          <div className="section_header">
            <h2>
              <span className="material-symbols-sharp">star</span>
              {t('featuredStores')}
            </h2>
            <span className="section_count">
              {t('count', { count: featuredStores.length })}
            </span>
          </div>
          <StoresGrid stores={featuredStores} locale={locale} />
        </section>
      )}

      <section className="all_stores_section">
        <div className="section_header">
          <h2>
            {featuredStores.length > 0 ? t('otherStores') : t('allStores')}
          </h2>
          <span className="section_count">
            {t('count', { count: regularStores.length })}
          </span>
        </div>
        <StoresGrid 
          stores={featuredStores.length > 0 ? regularStores : stores} 
          locale={locale} 
        />
      </section>
    </div>
  );
}
