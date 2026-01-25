// app/[locale]/stores/[slug]/page.jsx - UNIFIED ROUTE WITH HERO CAROUSEL
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import CategoryFilterTabs from "@/components/CategoryFilterTabs/CategoryFilterTabs";
import StoreHeader from "@/components/headers/StoreHeader";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreFAQ from "@/components/StoreFAQ/StoreFAQ";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import { FAQSchema } from "@/lib/seo/faqSchema";
import { getCategoryData, getCategorySEO, getCountryCategories } from "@/lib/storeCategories";
import { getStoresData, getStoreData } from "@/lib/stores";
import "./store-page.css";
import "./stores-page.css";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel/FeaturedProductsCarousel";
import OtherPromosSection from "@/components/OtherPromosSection/OtherPromosSection";

export const revalidate = 300;

/**
 * GENERATE METADATA - Determines if category or store
 */
export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');

    // Try as category first
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      return getCategorySEO(category, locale, countryCode);
    }

    // Try as store
    const store = await getStoreData(slug, language, countryCode);
    if (store) {
      const storeName = store.translations[0]?.name || store.slug;
      const isArabic = locale.startsWith('ar');
      
      return {
        title: isArabic 
          ? `كوبونات ${storeName} - خصومات حصرية`
          : `${storeName} Coupons & Deals - Save Money`,
        description: store.translations[0]?.description || `Get the best deals from ${storeName}`,
        alternates: {
          canonical: `/${locale}/stores/${slug}`
        }
      };
    }

    return { title: "Not Found" };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return { title: "Error" };
  }
}

/**
 * PAGE COMPONENT - Renders category page OR store page
 */
export default async function UnifiedStorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    
    const t = await getTranslations('StoresPage');
    const tStore = await getTranslations('StorePage');

    // ========================================
    // 1. TRY AS CATEGORY FIRST
    // ========================================
    const categoryData = await getCategoryData(slug, language, countryCode);

    if (categoryData) {
      // Fetch stores in this category
      const stores = await getStoresData({ 
        language, 
        countryCode, 
        categoryId: categoryData.id 
      });

      // Get featured stores with covers for carousel
      const featuredStoresWithCovers = stores.filter(s => 
        s.isFeatured && s.coverImage
      ).slice(0, 6);

      const carouselStores = featuredStoresWithCovers.map(store => ({
        id: store.id,
        image: store.coverImage,
        name: store.name,
        logo: store.logo,
      }));

      const featuredStores = stores.filter(s => s.isFeatured);
      const regularStores = stores.filter(s => !s.isFeatured);

      // Fetch all categories for filter tabs
      const allCategories = await getCountryCategories(language, countryCode);
      
      const translation = categoryData.translations[0];
      const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);

      return (
        <div className="stores_page">
          {/* Hero Carousel for Category - Featured stores in this category */}
          {carouselStores.length > 0 && (
            <div className="category-hero-section">
              <HeroCarousel 
                images={carouselStores}
                locale={locale}
                height="320px"
                autoplayDelay={3500}
              />
            </div>
          )}

          {/* Category Header */}
          <div className="stores_page_header">
            <div className="stores_page_header_container">
              <div className="stores_page_title_section">
                <div className="stores_page_icon">
                  <span className="material-symbols-sharp">
                    {categoryData.icon || 'category'}
                  </span>
                </div>
                <div className="stores_info">
                  <h1>{translation?.name || 'Category'}</h1>
                  {translation?.description && (
                    <p className="category_description">{translation.description}</p>
                  )}
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
                categories={allCategories}
                currentCategory={slug}
                locale={locale}
              />*/}
            </div>
          </div>

          {/* Stores Grid */}
          <main>
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
          </main>
        </div>
      );
    }

    // ========================================
    // 2. TRY AS STORE
    // ========================================
    const store = await getStoreData(slug, language, countryCode);

    if (store) {
      // Get country
      const country = await prisma.country.findUnique({
        where: { code: countryCode, isActive: true },
        include: {
          translations: {
            where: { locale: language }
          }
        }
      });

      if (!country) {
        return notFound();
      }

      // Transform store data
      const storeTranslation = store.translations[0];
      const transformedStore = {
        ...store,
        name: storeTranslation?.name || slug,
        slug: storeTranslation?.slug || slug,
        description: storeTranslation?.description || null,
        coverImage: store.coverImage, // Include cover image
        categories: store.categories.map(sc => ({
          id: sc.category.id,
          name: sc.category.translations[0]?.name || '',
          slug: sc.category.translations[0]?.slug || '',
          icon: sc.category.icon,
          color: sc.category.color
        }))
      };

      // Fetch vouchers
      const vouchers = await prisma.voucher.findMany({
        where: {
          storeId: store.id,
          AND: [
            {
              OR: [
                { expiryDate: null },
                { expiryDate: { gte: new Date() } }
              ]
            },
            {
              countries: {
                some: { country: { code: countryCode } }
              }
            }
          ]
        },
        include: {
          translations: { where: { locale: language } },
          _count: { select: { clicks: true } }
        },
        orderBy: [
          { isExclusive: 'desc' },
          { isVerified: 'desc' },
          { popularityScore: 'desc' }
        ]
      });

      const transformedVouchers = vouchers.map(v => ({
        ...v,
        title: v.translations[0]?.title || '',
        description: v.translations[0]?.description || null,
        store: transformedStore
      }));

      // Fetch payment methods
      const paymentMethodsData = await prisma.storePaymentMethod.findMany({
        where: {
          storeId: store.id,
          countryId: country.id
        },
        include: {
          paymentMethod: {
            include: {
              translations: { where: { locale: language } }
            }
          }
        }
      });

      const allPaymentMethods = paymentMethodsData.map(spm => ({
        ...spm.paymentMethod,
        name: spm.paymentMethod.translations[0]?.name || '',
        description: spm.paymentMethod.translations[0]?.description || null
      }));

      const bnplMethods = allPaymentMethods.filter(pm => pm.isBnpl);
      const otherPaymentMethods = allPaymentMethods.filter(pm => !pm.isBnpl);
      const mostTrackedVoucher = transformedVouchers[0] || null;

      // Fetch FAQs
      const faqs = await prisma.storeFAQ.findMany({
        where: {
          storeId: store.id,
          countryId: country.id,
          isActive: true
        },
        include: {
          translations: { where: { locale: language } }
        },
        orderBy: { order: 'asc' }
      });

      // Fetch related stores
      const relatedStores = await prisma.store.findMany({
        where: {
          id: { not: store.id },
          isActive: true,
          countries: {
            some: { country: { code: countryCode } }
          },
          categories: {
            some: {
              categoryId: { in: store.categories.map(sc => sc.categoryId) }
            }
          }
        },
        include: {
          translations: { where: { locale: language } },
          _count: {
            select: {
              vouchers: { where: { expiryDate: { gte: new Date() } } }
            }
          }
        },
        take: 6,
        orderBy: { isFeatured: 'desc' }
      });

      const transformedRelatedStores = relatedStores.map(s => ({
        ...s,
        name: s.translations[0]?.name || '',
        slug: s.translations[0]?.slug || ''
      }));

      // 2. FETCH FEATURED PRODUCTS [cite: 22, 24, 25]
      // We fetch products associated with this store that are marked isFeatured
      const storeProducts = await prisma.storeProduct.findMany({
        where: {
          storeId: store.id,
          isFeatured: true
        },
        include: {
          translations: {
            where: { locale: language }
          }
        },
        orderBy: { order: 'asc' },
        take: 12 // Limit to keep page light
      });

      // Transform products for the carousel [cite: 23, 25]
      const transformedProducts = storeProducts.map(p => ({
        id: p.id,
        image: p.image,
        title: p.translations[0]?.title || '', // Fallback for title
        price: p.price,
        originalPrice: p.originalPrice,
        productUrl: p.productUrl
      }));

      // Separate vouchers by type
      const codeVouchers = transformedVouchers.filter(v => v.type === 'CODE');
      const dealVouchers = transformedVouchers.filter(v => v.type === 'DEAL');
      const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');

      const countryName = country.translations[0]?.name || country.code;

      return (
        <>
          <FAQSchema faqs={faqs} locale={locale} />
          <div className="store-page-layout">
            {/* Hero Carousel - Single store cover */}
            {transformedStore.coverImage && (
              <div className="store-hero-section">
                <HeroCarousel 
                  images={[{
                    id: transformedStore.id,
                    image: transformedStore.coverImage,
                    name: transformedStore.name,
                    logo: transformedStore.logo,
                  }]}
                  locale={locale}
                  height="350px"
                  showDots={false}
                  showOverlay={false}
                  showContent={false}
                />
              </div>
            )}

            <StoreHeader 
              store={transformedStore}
              mostTrackedVoucher={mostTrackedVoucher}
              paymentMethods={otherPaymentMethods}
              bnplMethods={bnplMethods}
              locale={locale}
              country={country}
            />

            <main className="store-main-content">
              {transformedVouchers.length > 0 ? (
                <>
                  {codeVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">local_offer</span>
                        {tStore('couponCodes')}
                      </h2>
                      <VouchersGrid vouchers={codeVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {dealVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">shopping_bag</span>
                        {tStore('deals')}
                      </h2>
                      <VouchersGrid vouchers={dealVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {shippingVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">local_shipping</span>
                        {tStore('freeShipping')}
                      </h2>
                      <VouchersGrid vouchers={shippingVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {/* 3. INTEGRATE FEATURED PRODUCTS CAROUSEL HERE */}
                  {/* Placed after vouchers but before FAQs for high visibility */}
                  {transformedProducts.length > 0 && (
                    <FeaturedProductsCarousel
                      storeSlug={transformedStore.slug}
                      storeName={transformedStore.name}
                      storeLogo={transformedStore.logo}
                      products={transformedProducts} // <--- CHANGE THIS from 'initialProducts'
                    />
                  )}

                  {/* ADD OTHER PROMOS SECTION HERE */}
                  <OtherPromosSection storeSlug={transformedStore.slug} />

                  {faqs.length > 0 && (
                    <StoreFAQ 
                      faqs={faqs} 
                      locale={locale} 
                      storeName={transformedStore.name}
                      countryName={countryName}
                    />
                  )}

                  {transformedRelatedStores.length > 0 && (
                    <section className="related-stores-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">storefront</span>
                        {tStore('similarStores')}
                      </h2>
                      <div className="related-stores-grid">
                        {transformedRelatedStores.map((relatedStore) => (
                          <StoreCard
                            key={relatedStore.id} 
                            store={relatedStore} 
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="no-vouchers-state">
                  <span className="material-symbols-sharp">sentiment_dissatisfied</span>
                  <h3>{tStore('noActiveVouchers')}</h3>
                  <p>{tStore('checkBackSoon')}</p>
                  {transformedStore.websiteUrl && (
                    <a 
                      href={transformedStore.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visit-store-anyway-btn"
                    >
                      <span className="material-symbols-sharp">open_in_new</span>
                      {tStore('visitStoreAnyway')}
                    </a>
                  )}
                </div>
              )}
            </main>
          </div>
        </>
      );
    }

    // ========================================
    // 3. NOT FOUND
    // ========================================
    notFound();
    
  } catch (error) {
    console.error('Page render error:', error);
    throw error;
  }
}
