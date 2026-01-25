// app/[locale]/stores/page.jsx - WITH HERO CAROUSEL
import { getTranslations } from 'next-intl/server';
import { prisma } from "@/lib/prisma";
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import { getCountryCategories } from "@/lib/storeCategories";
import { getStoresData } from "@/lib/stores";
import "./stores-page.css";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';
  
  return {
    title: isArabic 
      ? `جميع المتاجر - كوبونات وعروض ${countryCode}`
      : `All Stores - Coupons & Deals ${countryCode}`,
    description: isArabic
      ? `تصفح جميع المتاجر المتاحة في ${countryCode}. احصل على أفضل الكوبونات والعروض من متاجرك المفضلة.`
      : `Browse all available stores in ${countryCode}. Get the best coupons and deals from your favorite stores.`,
    alternates: {
      canonical: `/${locale}/stores`
    }
  };
}

export default async function AllStoresPage({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');
  const t = await getTranslations('StoresPage');

  // Fetch featured stores with cover images for carousel
  const featuredStoresWithCovers = await prisma.store.findMany({
    where: { 
      isActive: true,
      isFeatured: true,
      coverImage: { not: null },
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

  // Transform carousel stores
  const carouselStores = featuredStoresWithCovers.map(store => {
    const translation = store.translations?.[0] || {};
    return {
      id: store.id,
      image: store.coverImage,
      name: translation.name || store.slug || '',
      logo: store.logo,
    };
  });

  // Fetch all stores for this country
  const stores = await getStoresData({ 
    language, 
    countryCode 
  });

  // Fetch all categories for filter tabs
  const categories = await getCountryCategories(language, countryCode);

  // Calculate totals
  const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
  const featuredStores = stores.filter(s => s.isFeatured);
  const regularStores = stores.filter(s => !s.isFeatured);

  // Empty state
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
      {/* Hero Carousel */}
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

      {/* Header */}
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

          {/* Category Filter Tabs 
          <CategoryFilterTabs 
            categories={categories}
            currentCategory={null}
            locale={locale}
          />*/}
        </div>
      </div>

      {/* Featured Stores Section */}
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

      {/* All Stores Section */}
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
